import type { ProgressDashboard } from "@/features/dashboard/types/dashboard";

export async function getDashboard(): Promise<ProgressDashboard> {
  const response = await fetch("/api/dashboard");
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      body?.error?.message ?? "No fue posible cargar el dashboard",
    );
  return body.data as ProgressDashboard;
}
