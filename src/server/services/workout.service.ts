import "server-only";
import { Prisma } from "@prisma/client";
import type {
  WorkoutInput,
  WorkoutUpdate,
} from "@/features/workouts/schemas/workout.schema";
import { ApiError } from "@/server/errors/api-error";
import { workoutRepository } from "@/server/repositories/workout.repository";
import { toWorkoutDto } from "./workout.mapper";

type ListInput = {
  clientId?: string;
  weekStart?: Date;
  page: number;
  limit: number;
};
const notFound = () =>
  new ApiError("NOT_FOUND", "No encontramos la sesión.", 404);

function idsFromWorkout(input: Pick<WorkoutInput, "exercises">) {
  return [...new Set(input.exercises.map((exercise) => exercise.exerciseId))];
}

function summary(
  records: Awaited<ReturnType<typeof workoutRepository.findMany>>,
) {
  return records.reduce(
    (result, workout) => {
      result.sessions += 1;
      if (workout.status === "COMPLETED") result.completed += 1;
      for (const exercise of workout.exercises) {
        result.sets += exercise.sets.length;
        for (const set of exercise.sets)
          result.volumeKg += (set.weightKg ?? 0) * (set.reps ?? 0);
      }
      return result;
    },
    { sessions: 0, completed: 0, sets: 0, volumeKg: 0 },
  );
}

export const workoutService = {
  async list(input: ListInput) {
    const organization = await workoutRepository.findDefaultOrganization();
    if (!organization)
      return {
        items: [],
        page: input.page,
        limit: input.limit,
        total: 0,
        totalPages: 1,
        summary: { sessions: 0, completed: 0, sets: 0, volumeKg: 0 },
      };
    const weekEnd = input.weekStart
      ? new Date(input.weekStart.getTime() + 7 * 24 * 60 * 60 * 1_000)
      : undefined;
    const where: Prisma.WorkoutSessionWhereInput = {
      organizationId: organization.id,
      clientId: input.clientId,
      ...(input.weekStart
        ? { performedAt: { gte: input.weekStart, lt: weekEnd } }
        : {}),
    };
    const [records, total, allRecords] = await Promise.all([
      workoutRepository.findMany(
        where,
        (input.page - 1) * input.limit,
        input.limit,
      ),
      workoutRepository.count(where),
      workoutRepository.findMany(where, 0, 500),
    ]);
    const exerciseIds = [
      ...new Set(
        allRecords.flatMap((workout) =>
          workout.exercises.map((exercise) => exercise.exerciseId),
        ),
      ),
    ];
    const exercises = await workoutRepository.findExercises(
      exerciseIds,
      organization.id,
    );
    const references = new Map(
      exercises.map((exercise) => [exercise.id, exercise]),
    );
    const weeklySummary = summary(allRecords);
    return {
      items: records.map((workout) => toWorkoutDto(workout, references)),
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
      summary: {
        ...weeklySummary,
        volumeKg: Number(weeklySummary.volumeKg.toFixed(1)),
      },
    };
  },
  async get(id: string) {
    const workout = await workoutRepository.findById(id);
    if (!workout) throw notFound();
    const exercises = await workoutRepository.findExercises(
      [...new Set(workout.exercises.map((exercise) => exercise.exerciseId))],
      workout.organizationId,
    );
    return toWorkoutDto(
      workout,
      new Map(exercises.map((exercise) => [exercise.id, exercise])),
    );
  },
  async validateContent(
    input: Pick<WorkoutInput, "exercises">,
    organizationId: string,
  ) {
    const ids = idsFromWorkout(input);
    const exercises = await workoutRepository.findExercises(
      ids,
      organizationId,
    );
    if (exercises.length !== ids.length)
      throw new ApiError(
        "VALIDATION_ERROR",
        "Uno o más ejercicios no están disponibles.",
        400,
      );
  },
  async create(input: WorkoutInput) {
    const organization = await workoutRepository.findDefaultOrganization();
    if (!organization)
      throw new ApiError(
        "SETUP_REQUIRED",
        "Configura una organización antes de registrar sesiones.",
        409,
      );
    const client = await workoutRepository.findClient(
      input.clientId,
      organization.id,
    );
    if (!client)
      throw new ApiError("NOT_FOUND", "No encontramos el cliente.", 404);
    await this.validateContent(input, organization.id);
    const workout = await workoutRepository.create(input, organization.id);
    return this.get(workout.id);
  },
  async update(id: string, input: WorkoutUpdate) {
    const existing = await workoutRepository.findById(id);
    if (!existing) throw notFound();
    if (input.exercises)
      await this.validateContent(
        { exercises: input.exercises },
        existing.organizationId,
      );
    await workoutRepository.update(id, input);
    return this.get(id);
  },
  async remove(id: string) {
    if (!(await workoutRepository.findById(id))) throw notFound();
    await workoutRepository.delete(id);
  },
};
