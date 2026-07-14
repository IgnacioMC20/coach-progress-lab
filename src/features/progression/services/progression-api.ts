import type { ProgressionDashboard } from "@/features/progression/types/progression";

export async function getProgression(clientId: string): Promise<ProgressionDashboard> {
  const response = await fetch(`/api/progression?clientId=${clientId}`);
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(body?.error?.message ?? "No fue posible calcular la progresión");
  return body.data as ProgressionDashboard;
}
