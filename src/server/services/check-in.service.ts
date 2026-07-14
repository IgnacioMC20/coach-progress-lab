import "server-only";
import { Prisma } from "@prisma/client";
import type {
  CheckInInput,
  CheckInUpdate,
} from "@/features/check-ins/schemas/check-in.schema";
import type { CheckInRecord } from "@/server/repositories/check-in.repository";
import { ApiError } from "@/server/errors/api-error";
import { checkInRepository } from "@/server/repositories/check-in.repository";
import { toCheckInDto } from "./check-in.mapper";

type ListInput = {
  clientId?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
};
const notFound = () => new ApiError("NOT_FOUND", "Check-in not found", 404);

function average(
  records: CheckInRecord[],
  key: "sleepHours" | "energyLevel" | "nutritionAdherence",
) {
  const values = records.flatMap((record) => {
    const value = record[key];
    return value === null ? [] : [value];
  });
  if (!values.length) return null;
  return Number(
    (values.reduce((total, value) => total + value, 0) / values.length).toFixed(1),
  );
}

export const checkInService = {
  async list(input: ListInput) {
    const organization = await checkInRepository.findDefaultOrganization();
    if (!organization)
      return {
        items: [],
        trend: [],
        page: input.page,
        limit: input.limit,
        total: 0,
        totalPages: 1,
        summary: {
          averageSleepHours: null,
          averageEnergyLevel: null,
          averageNutritionAdherence: null,
          latestWeightKg: null,
        },
      };
    const where: Prisma.CheckInWhereInput = {
      organizationId: organization.id,
      clientId: input.clientId,
      ...(input.from || input.to
        ? {
            checkInDate: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };
    const [records, total, trendRecords] = await Promise.all([
      checkInRepository.findMany(where, (input.page - 1) * input.limit, input.limit),
      checkInRepository.count(where),
      checkInRepository.findMany(where, 0, 52, "asc"),
    ]);
    const latestWithWeight = [...trendRecords]
      .reverse()
      .find((record) => record.weightKg !== null);
    return {
      items: records.map(toCheckInDto),
      trend: trendRecords.map(toCheckInDto),
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
      summary: {
        averageSleepHours: average(trendRecords, "sleepHours"),
        averageEnergyLevel: average(trendRecords, "energyLevel"),
        averageNutritionAdherence: average(trendRecords, "nutritionAdherence"),
        latestWeightKg: latestWithWeight?.weightKg ?? null,
      },
    };
  },
  async get(id: string) {
    const checkIn = await checkInRepository.findById(id);
    if (!checkIn) throw notFound();
    return toCheckInDto(checkIn);
  },
  async create(input: CheckInInput) {
    const organization = await checkInRepository.findDefaultOrganization();
    if (!organization)
      throw new ApiError(
        "SETUP_REQUIRED",
        "An organization is required before creating check-ins",
        409,
      );
    if (!(await checkInRepository.findClient(input.clientId, organization.id)))
      throw new ApiError("NOT_FOUND", "Client not found", 404);
    return toCheckInDto(await checkInRepository.create(input, organization.id));
  },
  async update(id: string, input: CheckInUpdate) {
    if (!(await checkInRepository.findById(id))) throw notFound();
    return toCheckInDto(await checkInRepository.update(id, input));
  },
  async remove(id: string) {
    if (!(await checkInRepository.findById(id))) throw notFound();
    await checkInRepository.delete(id);
  },
};
