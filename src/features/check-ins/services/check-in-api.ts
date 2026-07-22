import type {
  CheckIn,
  PaginatedCheckIns,
} from "@/features/check-ins/types/check-in";
import { apiRequest } from "@/lib/api-client";

export const checkInApi = {
  list: (params = new URLSearchParams()) =>
    apiRequest<PaginatedCheckIns>(`/api/check-ins?${params.toString()}`),
  get: (id: string) => apiRequest<CheckIn>(`/api/check-ins/${id}`),
  create: (data: unknown) =>
    apiRequest<CheckIn>("/api/check-ins", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiRequest<CheckIn>(`/api/check-ins/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/check-ins/${id}`, { method: "DELETE" }),
};
