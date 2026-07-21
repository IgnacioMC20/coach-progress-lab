import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type {
  ClientInput,
  ClientUpdate,
} from "@/features/clients/schemas/client.schema";

const clientInclude = {
  assessments: { orderBy: { assessedAt: "desc" }, take: 1 },
  _count: { select: { assessments: true } },
} satisfies Prisma.ClientInclude;
export type ClientRecord = Prisma.ClientGetPayload<{
  include: typeof clientInclude;
}>;

const clientDetailInclude = {
  assessments: { orderBy: { assessedAt: "desc" } },
  routineAssignments: {
    orderBy: { createdAt: "desc" },
    include: { routine: true, routineVersion: true },
  },
  circuitAssignments: {
    orderBy: { createdAt: "desc" },
    include: { circuit: true, circuitVersion: true },
  },
  _count: { select: { assessments: true } },
} satisfies Prisma.ClientInclude;
export type ClientDetailRecord = Prisma.ClientGetPayload<{
  include: typeof clientDetailInclude;
}>;

export const clientRepository = {
  findMany: (where: Prisma.ClientWhereInput, skip: number, take: number) =>
    prisma.client.findMany({
      where,
      skip,
      take,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: clientInclude,
    }),
  count: (where: Prisma.ClientWhereInput) => prisma.client.count({ where }),
  findById: (id: string) =>
    prisma.client.findUnique({
      where: { id },
      include: clientDetailInclude,
    }),
  findDefaultContext: async () => {
    const organization = await prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!organization) return null;
    const coach = await prisma.user.findFirst({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "asc" },
    });
    return { organizationId: organization.id, coachId: coach?.id };
  },
  create: (
    data: ClientInput,
    context: { organizationId: string; coachId?: string },
  ) =>
    prisma.client.create({
      data: { ...data, ...context },
      include: clientInclude,
    }),
  update: (id: string, data: ClientUpdate) =>
    prisma.client.update({ where: { id }, data, include: clientInclude }),
  delete: async (id: string) => {
    const sessions = await prisma.workoutSession.findMany({
      where: { clientId: id },
      select: { id: true },
    });
    const exercises = await prisma.workoutExercise.findMany({
      where: { sessionId: { in: sessions.map((session) => session.id) } },
      select: { id: true },
    });
    return prisma.$transaction([
      prisma.clientAssessment.deleteMany({ where: { clientId: id } }),
      prisma.routineAssignment.deleteMany({ where: { clientId: id } }),
      prisma.circuitAssignment.deleteMany({ where: { clientId: id } }),
      prisma.checkIn.deleteMany({ where: { clientId: id } }),
      prisma.workoutSet.deleteMany({
        where: {
          workoutExerciseId: { in: exercises.map((exercise) => exercise.id) },
        },
      }),
      prisma.workoutExercise.deleteMany({
        where: { sessionId: { in: sessions.map((session) => session.id) } },
      }),
      prisma.workoutSession.deleteMany({ where: { clientId: id } }),
      prisma.client.delete({ where: { id } }),
    ]);
  },
  createAssessment: (
    clientId: string,
    data: Omit<Prisma.ClientAssessmentUncheckedCreateInput, "clientId">,
  ) => prisma.clientAssessment.create({ data: { ...data, clientId } }),
  findAssessment: (clientId: string, assessmentId: string) =>
    prisma.clientAssessment.findFirst({
      where: { id: assessmentId, clientId },
    }),
  updateAssessment: (
    assessmentId: string,
    data: Omit<Prisma.ClientAssessmentUncheckedUpdateInput, "clientId">,
  ) => prisma.clientAssessment.update({ where: { id: assessmentId }, data }),
};
