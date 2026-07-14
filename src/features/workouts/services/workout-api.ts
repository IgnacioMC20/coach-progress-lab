import type {
  PaginatedWorkouts,
  WorkoutSession,
} from "@/features/workouts/types/workout";

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

export const workoutApi = {
  list: (params = new URLSearchParams()) =>
    request<PaginatedWorkouts>(`/api/workouts?${params.toString()}`),
  get: (id: string) => request<WorkoutSession>(`/api/workouts/${id}`),
  create: (data: unknown) =>
    request<WorkoutSession>("/api/workouts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    request<WorkoutSession>(`/api/workouts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id: string) => {
    const response = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("No fue posible eliminar el entrenamiento");
  },
};
