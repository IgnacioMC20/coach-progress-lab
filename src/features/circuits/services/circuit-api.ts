import type {
  CircuitAssignment,
  CircuitDetail,
  PaginatedCircuits,
} from "@/features/circuits/types/circuit";
import { apiRequest } from "@/lib/api-client";

export const circuitApi = {
  list: (params = new URLSearchParams()) =>
    apiRequest<PaginatedCircuits>(`/api/circuits?${params.toString()}`),
  get: (id: string) => apiRequest<CircuitDetail>(`/api/circuits/${id}`),
  create: (data: unknown) =>
    apiRequest<CircuitDetail>("/api/circuits", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiRequest<CircuitDetail>(`/api/circuits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  addVersion: (id: string, data: unknown) =>
    apiRequest<CircuitDetail>(`/api/circuits/${id}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  assign: (id: string, data: unknown) =>
    apiRequest<CircuitAssignment>(`/api/circuits/${id}/assignments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAssignment: (id: string, data: unknown) =>
    apiRequest<CircuitAssignment>(`/api/circuit-assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/circuits/${id}`, { method: "DELETE" }),
};
