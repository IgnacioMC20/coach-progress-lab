import type {
  PaginatedRoutines,
  RoutineAssignment,
  RoutineDetail,
} from "@/features/routines/types/routine";
import { apiRequest } from "@/lib/api-client";

export const routineApi = {
  list: (params = new URLSearchParams()) =>
    apiRequest<PaginatedRoutines>(`/api/routines?${params.toString()}`),
  get: (id: string) => apiRequest<RoutineDetail>(`/api/routines/${id}`),
  create: (data: unknown) =>
    apiRequest<RoutineDetail>("/api/routines", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiRequest<RoutineDetail>(`/api/routines/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  addVersion: (id: string, data: unknown) =>
    apiRequest<RoutineDetail>(`/api/routines/${id}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  assign: (id: string, data: unknown) =>
    apiRequest<RoutineAssignment>(`/api/routines/${id}/assignments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAssignment: (id: string, data: unknown) =>
    apiRequest<RoutineAssignment>(`/api/routine-assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/routines/${id}`, { method: "DELETE" }),
};
