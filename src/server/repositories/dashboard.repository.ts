import "server-only";
import { ClientStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { progressionInclude } from "@/server/repositories/progression.repository";

const dashboardClientInclude = {
  workoutSessions: {
    where: { status: "COMPLETED" },
    orderBy: { performedAt: "asc" },
    include: progressionInclude,
  },
  checkIns: { orderBy: { checkInDate: "desc" } },
} satisfies Prisma.ClientInclude;

export type DashboardClientRecord = Prisma.ClientGetPayload<{
  include: typeof dashboardClientInclude;
}>;

export const dashboardRepository = {
  findDefaultOrganization: () =>
    prisma.organization.findFirst({ orderBy: { createdAt: "asc" } }),
  findActiveClients: (organizationId: string) =>
    prisma.client.findMany({
      where: { organizationId, status: ClientStatus.ACTIVE },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      include: dashboardClientInclude,
    }),
  findExercises: (ids: string[], organizationId: string) =>
    prisma.exercise.findMany({
      where: { id: { in: ids }, organizationId },
      select: { id: true, name: true, equipment: true, minimumIncrement: true },
    }),
};
