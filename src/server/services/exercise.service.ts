import "server-only";
import { Prisma } from "@prisma/client";
import type {
  ExerciseInput,
  ExerciseUpdate,
} from "@/features/exercises/schemas/exercise.schema";
import type {
  EquipmentType,
  ExerciseReference,
  MovementPattern,
} from "@/features/exercises/types/exercise";
import { ApiError } from "@/server/errors/api-error";
import { exerciseRepository } from "@/server/repositories/exercise.repository";
import { toExerciseDto } from "./exercise.mapper";

type ListInput = {
  q?: string;
  equipment?: EquipmentType;
  movementPattern?: MovementPattern;
  page: number;
  limit: number;
};

const notFound = () =>
  new ApiError("NOT_FOUND", "No encontramos el ejercicio.", 404);

function referenceMap(
  records: Awaited<ReturnType<typeof exerciseRepository.findMany>>,
) {
  return new Map<string, ExerciseReference>(
    records.map((exercise) => [
      exercise.id,
      { id: exercise.id, name: exercise.name, equipment: exercise.equipment },
    ]),
  );
}

export const exerciseService = {
  async list(input: ListInput) {
    const organization = await exerciseRepository.findDefaultOrganization();
    if (!organization) {
      return {
        items: [],
        page: input.page,
        limit: input.limit,
        total: 0,
        totalPages: 1,
        summary: { total: 0, weighted: 0, bodyweight: 0, withSubstitutions: 0 },
      };
    }
    const where: Prisma.ExerciseWhereInput = {
      organizationId: organization.id,
      equipment: input.equipment,
      movementPattern: input.movementPattern,
      ...(input.q ? { name: { contains: input.q, mode: "insensitive" } } : {}),
    };
    const [
      records,
      total,
      weighted,
      bodyweight,
      withSubstitutions,
      allExercises,
    ] = await Promise.all([
      exerciseRepository.findMany(
        where,
        (input.page - 1) * input.limit,
        input.limit,
      ),
      exerciseRepository.count(where),
      exerciseRepository.count({ ...where, measurementType: "WEIGHT_REPS" }),
      exerciseRepository.count({
        ...where,
        measurementType: "BODYWEIGHT_REPS",
      }),
      exerciseRepository.countWithSubstitutions(where),
      exerciseRepository.findMany({ organizationId: organization.id }, 0, 500),
    ]);
    const substitutes = referenceMap(allExercises);
    return {
      items: records.map((exercise) => toExerciseDto(exercise, substitutes)),
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
      summary: { total, weighted, bodyweight, withSubstitutions },
    };
  },
  async get(id: string) {
    const exercise = await exerciseRepository.findById(id);
    if (!exercise) throw notFound();
    const substitutes = referenceMap(
      await exerciseRepository.findByIds(
        exercise.substituteIds,
        exercise.organizationId,
      ),
    );
    return toExerciseDto(exercise, substitutes);
  },
  async validateSubstitutes(
    substituteIds: string[] | undefined,
    organizationId: string,
    exerciseId?: string,
  ) {
    if (!substituteIds) return;
    if (exerciseId && substituteIds.includes(exerciseId))
      throw new ApiError(
        "VALIDATION_ERROR",
        "Un ejercicio no puede ser su propio sustituto.",
        400,
      );
    const exercises = await exerciseRepository.findByIds(
      substituteIds,
      organizationId,
    );
    if (exercises.length !== substituteIds.length)
      throw new ApiError(
        "VALIDATION_ERROR",
        "Uno o más ejercicios sustitutos no están disponibles.",
        400,
      );
  },
  async create(input: ExerciseInput) {
    const organization = await exerciseRepository.findDefaultOrganization();
    if (!organization)
      throw new ApiError(
        "SETUP_REQUIRED",
        "Configura una organización antes de crear ejercicios.",
        409,
      );
    await this.validateSubstitutes(input.substituteIds, organization.id);
    const exercise = await exerciseRepository.create(input, organization.id);
    return this.get(exercise.id);
  },
  async update(id: string, input: ExerciseUpdate) {
    const exercise = await exerciseRepository.findById(id);
    if (!exercise) throw notFound();
    await this.validateSubstitutes(
      input.substituteIds,
      exercise.organizationId,
      id,
    );
    await exerciseRepository.update(id, input);
    return this.get(id);
  },
  async remove(id: string) {
    if (!(await exerciseRepository.findById(id))) throw notFound();
    await exerciseRepository.delete(id);
  },
};
