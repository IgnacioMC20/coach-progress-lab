import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type {
  WorkoutInput,
  WorkoutUpdate,
} from "@/features/workouts/schemas/workout.schema";

const workoutInclude = {
  client: true,
  exercises: {
    orderBy: { position: "asc" },
    include: { sets: { orderBy: { position: "asc" } } },
  },
} satisfies Prisma.WorkoutSessionInclude;

export type WorkoutRecord = Prisma.WorkoutSessionGetPayload<{
  include: typeof workoutInclude;
}>;

function exercisesData(exercises: WorkoutInput["exercises"]) {
  return {
    create: exercises.map((exercise, exerciseIndex) => ({
      exerciseId: exercise.exerciseId,
      notes: exercise.notes,
      position: exerciseIndex + 1,
      sets: {
        create: exercise.sets.map((set, setIndex) => ({
          ...set,
          position: setIndex + 1,
        })),
      },
    })),
  } satisfies Prisma.WorkoutExerciseCreateNestedManyWithoutSessionInput;
}

export const workoutRepository = {
  findDefaultOrganization: () =>
    prisma.organization.findFirst({ orderBy: { createdAt: "asc" } }),
  findMany: (where: Prisma.WorkoutSessionWhereInput, skip: number, take: number) =>
    prisma.workoutSession.findMany({
      where,
      skip,
      take,
      orderBy: { performedAt: "desc" },
      include: workoutInclude,
    }),
  count: (where: Prisma.WorkoutSessionWhereInput) =>
    prisma.workoutSession.count({ where }),
  findById: (id: string) =>
    prisma.workoutSession.findUnique({ where: { id }, include: workoutInclude }),
  findClient: (id: string, organizationId: string) =>
    prisma.client.findFirst({ where: { id, organizationId } }),
  findExercises: (ids: string[], organizationId: string) =>
    prisma.exercise.findMany({
      where: { id: { in: ids }, organizationId },
      select: { id: true, name: true, equipment: true },
    }),
  create: (input: WorkoutInput, organizationId: string) => {
    const { exercises, ...session } = input;
    return prisma.workoutSession.create({
      data: { ...session, organizationId, exercises: exercisesData(exercises) },
      include: workoutInclude,
    });
  },
  update: async (id: string, input: WorkoutUpdate) => {
    const { exercises, ...session } = input;
    return prisma.$transaction(async (tx) => {
      if (exercises) {
        const loggedExercises = await tx.workoutExercise.findMany({
          where: { sessionId: id },
          select: { id: true },
        });
        await tx.workoutSet.deleteMany({
          where: {
            workoutExerciseId: { in: loggedExercises.map((exercise) => exercise.id) },
          },
        });
        await tx.workoutExercise.deleteMany({ where: { sessionId: id } });
      }
      return tx.workoutSession.update({
        where: { id },
        data: {
          ...session,
          ...(exercises ? { exercises: exercisesData(exercises) } : {}),
        },
        include: workoutInclude,
      });
    });
  },
  delete: async (id: string) => {
    const loggedExercises = await prisma.workoutExercise.findMany({
      where: { sessionId: id },
      select: { id: true },
    });
    return prisma.$transaction([
      prisma.workoutSet.deleteMany({
        where: {
          workoutExerciseId: { in: loggedExercises.map((exercise) => exercise.id) },
        },
      }),
      prisma.workoutExercise.deleteMany({ where: { sessionId: id } }),
      prisma.workoutSession.delete({ where: { id } }),
    ]);
  },
};
