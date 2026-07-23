import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { findOrCreateDefaultOrganization } from "@/server/repositories/organization.repository";

export const progressionInclude = {
  exercises: {
    orderBy: { position: "asc" },
    include: { sets: { orderBy: { position: "asc" } } },
  },
} satisfies Prisma.WorkoutSessionInclude;

export type ProgressionSessionRecord = Prisma.WorkoutSessionGetPayload<{
  include: typeof progressionInclude;
}>;

export const progressionRepository = {
  findDefaultOrganization: findOrCreateDefaultOrganization,
  findClient: (id: string, organizationId: string) =>
    prisma.client.findFirst({ where: { id, organizationId } }),
  findCompletedSessions: (clientId: string, organizationId: string) =>
    prisma.workoutSession.findMany({
      where: { clientId, organizationId, status: "COMPLETED" },
      orderBy: { performedAt: "asc" },
      include: progressionInclude,
    }),
  findExercises: (ids: string[], organizationId: string) =>
    prisma.exercise.findMany({
      where: { id: { in: ids }, organizationId },
      select: { id: true, name: true, equipment: true, minimumIncrement: true },
    }),
};
