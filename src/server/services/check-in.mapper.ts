import "server-only";
import type { CheckIn } from "@/features/check-ins/types/check-in";
import type { CheckInRecord } from "@/server/repositories/check-in.repository";

export function toCheckInDto(record: CheckInRecord): CheckIn {
  return {
    id: record.id,
    clientId: record.clientId,
    clientName: `${record.client.firstName} ${record.client.lastName}`,
    checkInDate: record.checkInDate.toISOString(),
    weightKg: record.weightKg,
    chestCm: record.chestCm,
    waistCm: record.waistCm,
    hipCm: record.hipCm,
    sleepHours: record.sleepHours,
    steps: record.steps,
    energyLevel: record.energyLevel,
    hungerLevel: record.hungerLevel,
    nutritionAdherence: record.nutritionAdherence,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
