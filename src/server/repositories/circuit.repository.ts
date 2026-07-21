import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type {
  CircuitAssignmentInput,
  CircuitAssignmentUpdate,
  CircuitInput,
  CircuitUpdate,
  CircuitVersionInput,
} from "@/features/circuits/schemas/circuit.schema";

const versionInclude = {
  exercises: { orderBy: { position: "asc" } },
} satisfies Prisma.CircuitVersionInclude;
const circuitDetailInclude = {
  versions: { orderBy: { version: "desc" }, include: versionInclude },
  assignments: {
    orderBy: { createdAt: "desc" },
    include: { client: true, circuitVersion: true },
  },
} satisfies Prisma.CircuitTemplateInclude;
const circuitListInclude = {
  versions: {
    orderBy: { version: "desc" },
    take: 1,
    include: { _count: { select: { exercises: true } } },
  },
  _count: { select: { assignments: true } },
} satisfies Prisma.CircuitTemplateInclude;

export type CircuitVersionRecord = Prisma.CircuitVersionGetPayload<{
  include: typeof versionInclude;
}>;
export type CircuitDetailRecord = Prisma.CircuitTemplateGetPayload<{
  include: typeof circuitDetailInclude;
}>;
export type CircuitListRecord = Prisma.CircuitTemplateGetPayload<{
  include: typeof circuitListInclude;
}>;

function versionData(
  input: CircuitVersionInput,
  circuitId: string,
  version: number,
) {
  return {
    circuitId,
    version,
    rounds: input.rounds,
    restBetweenRoundsSeconds: input.restBetweenRoundsSeconds,
    notes: input.notes,
    exercises: {
      create: input.exercises.map((exercise, position) => ({
        ...exercise,
        position: position + 1,
      })),
    },
  } satisfies Prisma.CircuitVersionUncheckedCreateInput;
}

export const circuitRepository = {
  findDefaultOrganization: () =>
    prisma.organization.findFirst({ orderBy: { createdAt: "asc" } }),
  findMany: (
    where: Prisma.CircuitTemplateWhereInput,
    skip: number,
    take: number,
  ) =>
    prisma.circuitTemplate.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      include: circuitListInclude,
    }),
  count: (where: Prisma.CircuitTemplateWhereInput) =>
    prisma.circuitTemplate.count({ where }),
  countAssignments: (organizationId: string) =>
    prisma.circuitAssignment.count({ where: { circuit: { organizationId } } }),
  findById: (id: string) =>
    prisma.circuitTemplate.findUnique({
      where: { id },
      include: circuitDetailInclude,
    }),
  findVersion: (circuitId: string, versionId: string) =>
    prisma.circuitVersion.findFirst({ where: { id: versionId, circuitId } }),
  findAssignment: (id: string) =>
    prisma.circuitAssignment.findUnique({ where: { id } }),
  findExercises: (ids: string[], organizationId: string) =>
    prisma.exercise.findMany({
      where: { id: { in: ids }, organizationId },
      select: { id: true, name: true, equipment: true },
    }),
  findClient: (id: string, organizationId: string) =>
    prisma.client.findFirst({ where: { id, organizationId } }),
  create: async (input: CircuitInput, organizationId: string) => {
    const { exercises, rounds, restBetweenRoundsSeconds, notes, ...circuit } =
      input;
    return prisma.$transaction(async (tx) => {
      const template = await tx.circuitTemplate.create({
        data: { ...circuit, organizationId },
      });
      await tx.circuitVersion.create({
        data: versionData(
          { exercises, rounds, restBetweenRoundsSeconds, notes },
          template.id,
          1,
        ),
      });
      return template;
    });
  },
  update: (id: string, data: CircuitUpdate) =>
    prisma.circuitTemplate.update({ where: { id }, data }),
  createVersion: async (circuitId: string, input: CircuitVersionInput) =>
    prisma.$transaction(async (tx) => {
      const latest = await tx.circuitVersion.findFirst({
        where: { circuitId },
        orderBy: { version: "desc" },
      });
      const version = await tx.circuitVersion.create({
        data: versionData(input, circuitId, (latest?.version ?? 0) + 1),
      });
      await tx.circuitTemplate.update({
        where: { id: circuitId },
        data: { status: "PUBLISHED" },
      });
      return version;
    }),
  assign: (circuitId: string, input: CircuitAssignmentInput) =>
    prisma.circuitAssignment.create({
      data: { ...input, circuitId },
      include: { client: true, circuitVersion: true },
    }),
  updateAssignment: (id: string, input: CircuitAssignmentUpdate) =>
    prisma.circuitAssignment.update({
      where: { id },
      data: {
        ...input,
        endDate:
          input.endDate ??
          (input.status === "COMPLETED" ? new Date() : undefined),
      },
      include: { client: true, circuitVersion: true },
    }),
  delete: async (id: string) => {
    const versions = await prisma.circuitVersion.findMany({
      where: { circuitId: id },
      select: { id: true },
    });
    const versionIds = versions.map((version) => version.id);
    return prisma.$transaction([
      prisma.circuitAssignment.deleteMany({ where: { circuitId: id } }),
      prisma.circuitExercise.deleteMany({
        where: { circuitVersionId: { in: versionIds } },
      }),
      prisma.circuitVersion.deleteMany({ where: { circuitId: id } }),
      prisma.circuitTemplate.delete({ where: { id } }),
    ]);
  },
};
