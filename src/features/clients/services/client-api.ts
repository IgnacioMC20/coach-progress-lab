import type {
  Client,
  ClientDetail,
  PaginatedClients,
} from "@/features/clients/types/client";
import { apiRequest } from "@/lib/api-client";
export const clientApi = {
  list: (params: URLSearchParams) =>
    apiRequest<PaginatedClients>(`/api/clients?${params.toString()}`),
  get: (id: string) => apiRequest<ClientDetail>(`/api/clients/${id}`),
  create: (data: unknown) =>
    apiRequest<Client>("/api/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiRequest<Client>(`/api/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  addAssessment: (id: string, data: unknown) =>
    apiRequest(`/api/clients/${id}/assessments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAssessment: (clientId: string, assessmentId: string, data: unknown) =>
    apiRequest(`/api/clients/${clientId}/assessments/${assessmentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/clients/${id}`, { method: "DELETE" }),
};
