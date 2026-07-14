import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type {
  CheckInInput,
  CheckInUpdate,
} from "@/features/check-ins/schemas/check-in.schema";

const checkInInclude = { client: true } satisfies Prisma.CheckInInclude;
export type CheckInRecord = Prisma.CheckInGetPayload<{ include: typeof checkInInclude }>;

export const checkInRepository = {
  findDefaultOrganization: () =>
    prisma.organization.findFirst({ orderBy: { createdAt: "asc" } }),
  findMany: (
    where: Prisma.CheckInWhereInput,
    skip: number,
    take: number,
    order: Prisma.SortOrder = "desc",
  ) =>
    prisma.checkIn.findMany({
      where,
      skip,
      take,
      orderBy: { checkInDate: order },
      include: checkInInclude,
    }),
  count: (where: Prisma.CheckInWhereInput) => prisma.checkIn.count({ where }),
  findById: (id: string) =>
    prisma.checkIn.findUnique({ where: { id }, include: checkInInclude }),
  findClient: (id: string, organizationId: string) =>
    prisma.client.findFirst({ where: { id, organizationId } }),
  create: (input: CheckInInput, organizationId: string) =>
    prisma.checkIn.create({
      data: { ...input, organizationId },
      include: checkInInclude,
    }),
  update: (id: string, input: CheckInUpdate) =>
    prisma.checkIn.update({ where: { id }, data: input, include: checkInInclude }),
  delete: (id: string) => prisma.checkIn.delete({ where: { id } }),
};
