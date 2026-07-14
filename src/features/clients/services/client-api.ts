import type {
  Client,
  ClientDetail,
  PaginatedClients,
} from "@/features/clients/types/client";

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
export const clientApi = {
  list: (params: URLSearchParams) =>
    request<PaginatedClients>(`/api/clients?${params.toString()}`),
  get: (id: string) => request<ClientDetail>(`/api/clients/${id}`),
  create: (data: unknown) =>
    request<Client>("/api/clients", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: unknown) =>
    request<Client>(`/api/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  addAssessment: (id: string, data: unknown) =>
    request(`/api/clients/${id}/assessments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAssessment: (clientId: string, assessmentId: string, data: unknown) =>
    request(`/api/clients/${clientId}/assessments/${assessmentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id: string) => {
    const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("No fue posible eliminar el cliente");
  },
};
