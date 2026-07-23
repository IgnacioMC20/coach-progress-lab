import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type {
  RoutineAssignmentInput,
  RoutineAssignmentUpdate,
  RoutineInput,
  RoutineUpdate,
  RoutineVersionInput,
} from "@/features/routines/schemas/routine.schema";
import { findOrCreateDefaultOrganization } from "@/server/repositories/organization.repository";

const versionInclude = {
  days: {
    orderBy: { position: "asc" },
    include: {
      blocks: {
        orderBy: { position: "asc" },
        include: { exercises: { orderBy: { position: "asc" } } },
      },
    },
  },
} satisfies Prisma.RoutineVersionInclude;

const routineDetailInclude = {
  versions: { orderBy: { version: "desc" }, include: versionInclude },
  assignments: {
    orderBy: { createdAt: "desc" },
    include: { client: true, routineVersion: true },
  },
} satisfies Prisma.RoutineTemplateInclude;

const routineListInclude = {
  versions: {
    orderBy: { version: "desc" },
    take: 1,
    include: { _count: { select: { days: true } } },
  },
  _count: { select: { assignments: true } },
} satisfies Prisma.RoutineTemplateInclude;

export type RoutineVersionRecord = Prisma.RoutineVersionGetPayload<{
  include: typeof versionInclude;
}>;
export type RoutineDetailRecord = Prisma.RoutineTemplateGetPayload<{
  include: typeof routineDetailInclude;
}>;
export type RoutineListRecord = Prisma.RoutineTemplateGetPayload<{
  include: typeof routineListInclude;
}>;

function versionData(
  input: RoutineVersionInput,
  routineId: string,
  version: number,
) {
  return {
    routineId,
    version,
    notes: input.notes,
    days: {
      create: input.days.map((day, dayIndex) => ({
        name: day.name,
        position: dayIndex + 1,
        blocks: {
          create: day.blocks.map((block, blockIndex) => ({
            name: block.name,
            type: block.type,
            position: blockIndex + 1,
            restSeconds: block.restSeconds,
            exercises: {
              create: block.exercises.map((exercise, exerciseIndex) => ({
                ...exercise,
                position: exerciseIndex + 1,
              })),
            },
          })),
        },
      })),
    },
  } satisfies Prisma.RoutineVersionUncheckedCreateInput;
}

export const routineRepository = {
  findDefaultOrganization: findOrCreateDefaultOrganization,
  findMany: (
    where: Prisma.RoutineTemplateWhereInput,
    skip: number,
    take: number,
  ) =>
    prisma.routineTemplate.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      include: routineListInclude,
    }),
  count: (where: Prisma.RoutineTemplateWhereInput) =>
    prisma.routineTemplate.count({ where }),
  countAssignments: (organizationId: string) =>
    prisma.routineAssignment.count({ where: { routine: { organizationId } } }),
  findById: (id: string) =>
    prisma.routineTemplate.findUnique({
      where: { id },
      include: routineDetailInclude,
    }),
  findVersion: (routineId: string, versionId: string) =>
    prisma.routineVersion.findFirst({ where: { id: versionId, routineId } }),
  findAssignment: (id: string) =>
    prisma.routineAssignment.findUnique({ where: { id } }),
  findExercises: (ids: string[], organizationId: string) =>
    prisma.exercise.findMany({
      where: { id: { in: ids }, organizationId },
      select: { id: true, name: true, equipment: true },
    }),
  findClient: (id: string, organizationId: string) =>
    prisma.client.findFirst({ where: { id, organizationId } }),
  create: async (input: RoutineInput, organizationId: string) => {
    const { days, notes, ...routine } = input;
    return prisma.$transaction(async (tx) => {
      const template = await tx.routineTemplate.create({
        data: { ...routine, organizationId },
      });
      await tx.routineVersion.create({
        data: versionData({ days, notes }, template.id, 1),
      });
      return template;
    });
  },
  update: (id: string, data: RoutineUpdate) =>
    prisma.routineTemplate.update({ where: { id }, data }),
  createVersion: async (routineId: string, input: RoutineVersionInput) =>
    prisma.$transaction(async (tx) => {
      const latest = await tx.routineVersion.findFirst({
        where: { routineId },
        orderBy: { version: "desc" },
      });
      const version = await tx.routineVersion.create({
        data: versionData(input, routineId, (latest?.version ?? 0) + 1),
      });
      await tx.routineTemplate.update({
        where: { id: routineId },
        data: { status: "PUBLISHED" },
      });
      return version;
    }),
  assign: async (routineId: string, input: RoutineAssignmentInput) =>
    prisma.$transaction(async (tx) => {
      const completedAt = new Date();
      await tx.routineAssignment.updateMany({
        where: { clientId: input.clientId, status: "ACTIVE" },
        data: { status: "COMPLETED", endDate: completedAt },
      });
      const assignment = await tx.routineAssignment.create({
        data: { ...input, routineId },
        include: { client: true, routineVersion: true },
      });
      const routine = await tx.routineTemplate.findUniqueOrThrow({
        where: { id: routineId },
      });
      await tx.client.update({
        where: { id: input.clientId },
        data: { currentProgram: routine.name, currentWeek: 1 },
      });
      return assignment;
    }),
  updateAssignment: (id: string, input: RoutineAssignmentUpdate) =>
    prisma.routineAssignment.update({
      where: { id },
      data: {
        ...input,
        endDate:
          input.endDate ??
          (input.status === "COMPLETED" ? new Date() : undefined),
      },
      include: { client: true, routineVersion: true },
    }),
  delete: async (id: string) => {
    const routine = await prisma.routineTemplate.findUnique({
      where: { id },
      select: { name: true },
    });
    const assignments = await prisma.routineAssignment.findMany({
      where: { routineId: id },
      select: { clientId: true },
    });
    const versions = await prisma.routineVersion.findMany({
      where: { routineId: id },
      select: { id: true },
    });
    const versionIds = versions.map((version) => version.id);
    const days = await prisma.routineDay.findMany({
      where: { versionId: { in: versionIds } },
      select: { id: true },
    });
    const dayIds = days.map((day) => day.id);
    const blocks = await prisma.routineBlock.findMany({
      where: { dayId: { in: dayIds } },
      select: { id: true },
    });
    return prisma.$transaction([
      prisma.client.updateMany({
        where: {
          id: { in: assignments.map((assignment) => assignment.clientId) },
          currentProgram: routine?.name,
        },
        data: { currentProgram: null, currentWeek: null },
      }),
      prisma.routineAssignment.deleteMany({ where: { routineId: id } }),
      prisma.routineExercise.deleteMany({
        where: { blockId: { in: blocks.map((block) => block.id) } },
      }),
      prisma.routineBlock.deleteMany({ where: { dayId: { in: dayIds } } }),
      prisma.routineDay.deleteMany({
        where: { versionId: { in: versionIds } },
      }),
      prisma.routineVersion.deleteMany({ where: { routineId: id } }),
      prisma.routineTemplate.delete({ where: { id } }),
    ]);
  },
};
