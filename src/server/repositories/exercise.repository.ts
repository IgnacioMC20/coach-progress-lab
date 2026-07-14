import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type {
  ExerciseInput,
  ExerciseUpdate,
} from "@/features/exercises/schemas/exercise.schema";

export type ExerciseRecord = Prisma.ExerciseGetPayload<Record<string, never>>;

export const exerciseRepository = {
  findDefaultOrganization: () =>
    prisma.organization.findFirst({ orderBy: { createdAt: "asc" } }),
  findMany: (where: Prisma.ExerciseWhereInput, skip: number, take: number) =>
    prisma.exercise.findMany({
      where,
      skip,
      take,
      orderBy: [{ name: "asc" }],
    }),
  count: (where: Prisma.ExerciseWhereInput) => prisma.exercise.count({ where }),
  countWithSubstitutions: (where: Prisma.ExerciseWhereInput) =>
    prisma.exercise.count({ where: { ...where, substituteIds: { isEmpty: false } } }),
  findById: (id: string) => prisma.exercise.findUnique({ where: { id } }),
  findByIds: (ids: string[], organizationId: string) =>
    prisma.exercise.findMany({ where: { id: { in: ids }, organizationId } }),
  create: (data: ExerciseInput, organizationId: string) =>
    prisma.exercise.create({ data: { ...data, organizationId } }),
  update: (id: string, data: ExerciseUpdate) =>
    prisma.exercise.update({ where: { id }, data }),
  delete: async (id: string) => {
    const referencers = await prisma.exercise.findMany({
      where: { substituteIds: { has: id } },
      select: { id: true, substituteIds: true },
    });
    return prisma.$transaction([
      ...referencers.map((exercise) =>
        prisma.exercise.update({
          where: { id: exercise.id },
          data: {
            substituteIds: exercise.substituteIds.filter(
              (substituteId) => substituteId !== id,
            ),
          },
        }),
      ),
      prisma.exercise.delete({ where: { id } }),
    ]);
  },
};
