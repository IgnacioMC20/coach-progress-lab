import "server-only";
import type {
  ClientAssessment,
  Client as ClientDto,
} from "@/features/clients/types/client";
import type { ClientRecord } from "@/server/repositories/client.repository";

function calculateAge(birthDate: Date | null) {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const month = today.getUTCMonth() - birthDate.getUTCMonth();
  if (month < 0 || (month === 0 && today.getUTCDate() < birthDate.getUTCDate())) age -= 1;
  return age;
}
function assessmentDto(assessment: {
  id: string;
  assessedAt: Date;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  notes: string | null;
}): ClientAssessment {
  return { ...assessment, assessedAt: assessment.assessedAt.toISOString() };
}
export function toClientDto(client: ClientRecord): ClientDto {
  const latest = client.assessments[0] ?? null;
  const bmi =
    client.heightCm && latest?.weightKg
      ? Number((latest.weightKg / (client.heightCm / 100) ** 2).toFixed(1))
      : null;
  return {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    fullName: `${client.firstName} ${client.lastName}`,
    status: client.status,
    email: client.email,
    phone: client.phone,
    birthDate: client.birthDate?.toISOString() ?? null,
    age: calculateAge(client.birthDate),
    heightCm: client.heightCm,
    bmi,
    primaryGoal: client.primaryGoal,
    trainingLevel: client.trainingLevel,
    currentProgram: client.currentProgram,
    currentWeek: client.currentWeek,
    notes: client.notes,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    latestAssessment: latest ? assessmentDto(latest) : null,
    assessmentCount: client._count.assessments,
  };
}
export function toClientDetailDto(client: ClientRecord | null) {
  if (!client) return null;
  const latest = client.assessments[0] ?? null;
  const bmi =
    client.heightCm && latest?.weightKg
      ? Number((latest.weightKg / (client.heightCm / 100) ** 2).toFixed(1))
      : null;
  return {
    ...toClientDto({ ...client, assessments: latest ? [latest] : [] }),
    assessments: client.assessments.map(assessmentDto),
    bmi,
  };
}
