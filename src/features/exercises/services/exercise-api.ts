import type {
  Exercise,
  PaginatedExercises,
} from "@/features/exercises/types/exercise";
import { apiRequest } from "@/lib/api-client";

export const exerciseApi = {
  list: (params = new URLSearchParams()) =>
    apiRequest<PaginatedExercises>(`/api/exercises?${params.toString()}`),
  get: (id: string) => apiRequest<Exercise>(`/api/exercises/${id}`),
  create: (data: unknown) =>
    apiRequest<Exercise>("/api/exercises", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiRequest<Exercise>(`/api/exercises/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/exercises/${id}`, { method: "DELETE" }),
};
