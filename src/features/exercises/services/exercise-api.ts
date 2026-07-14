import type { Exercise, PaginatedExercises } from "@/features/exercises/types/exercise";

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

export const exerciseApi = {
  list: (params = new URLSearchParams()) =>
    request<PaginatedExercises>(`/api/exercises?${params.toString()}`),
  get: (id: string) => request<Exercise>(`/api/exercises/${id}`),
  create: (data: unknown) =>
    request<Exercise>("/api/exercises", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: unknown) =>
    request<Exercise>(`/api/exercises/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id: string) => {
    const response = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("No fue posible eliminar el ejercicio");
  },
};
