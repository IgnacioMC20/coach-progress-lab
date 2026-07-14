import type {
  PaginatedRoutines,
  RoutineAssignment,
  RoutineDetail,
} from "@/features/routines/types/routine";

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

export const routineApi = {
  list: (params = new URLSearchParams()) =>
    request<PaginatedRoutines>(`/api/routines?${params.toString()}`),
  get: (id: string) => request<RoutineDetail>(`/api/routines/${id}`),
  create: (data: unknown) =>
    request<RoutineDetail>("/api/routines", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    request<RoutineDetail>(`/api/routines/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  addVersion: (id: string, data: unknown) =>
    request<RoutineDetail>(`/api/routines/${id}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  assign: (id: string, data: unknown) =>
    request<RoutineAssignment>(`/api/routines/${id}/assignments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAssignment: (id: string, data: unknown) =>
    request<RoutineAssignment>(`/api/routine-assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id: string) => {
    const response = await fetch(`/api/routines/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("No fue posible eliminar la rutina");
  },
};
