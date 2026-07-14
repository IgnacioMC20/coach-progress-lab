import type { CheckIn, PaginatedCheckIns } from "@/features/check-ins/types/check-in";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(body?.error?.message ?? "No fue posible completar la solicitud");
  return body.data as T;
}

export const checkInApi = {
  list: (params = new URLSearchParams()) =>
    request<PaginatedCheckIns>(`/api/check-ins?${params.toString()}`),
  get: (id: string) => request<CheckIn>(`/api/check-ins/${id}`),
  create: (data: unknown) =>
    request<CheckIn>("/api/check-ins", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    request<CheckIn>(`/api/check-ins/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id: string) => {
    const response = await fetch(`/api/check-ins/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("No fue posible eliminar el check-in");
  },
};
