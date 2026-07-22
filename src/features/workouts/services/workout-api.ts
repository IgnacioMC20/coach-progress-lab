import type {
  PaginatedWorkouts,
  WorkoutSession,
} from "@/features/workouts/types/workout";
import { apiRequest } from "@/lib/api-client";

export const workoutApi = {
  list: (params = new URLSearchParams()) =>
    apiRequest<PaginatedWorkouts>(`/api/workouts?${params.toString()}`),
  get: (id: string) => apiRequest<WorkoutSession>(`/api/workouts/${id}`),
  create: (data: unknown) =>
    apiRequest<WorkoutSession>("/api/workouts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiRequest<WorkoutSession>(`/api/workouts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/workouts/${id}`, { method: "DELETE" }),
};
