import type {
  CircuitAssignment,
  CircuitDetail,
  PaginatedCircuits,
} from "@/features/circuits/types/circuit";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      body?.error?.message ?? "No fue posible completar la solicitud",
    );
  return body.data as T;
}

export const circuitApi = {
  list: (params = new URLSearchParams()) =>
    request<PaginatedCircuits>(`/api/circuits?${params.toString()}`),
  get: (id: string) => request<CircuitDetail>(`/api/circuits/${id}`),
  create: (data: unknown) =>
    request<CircuitDetail>("/api/circuits", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    request<CircuitDetail>(`/api/circuits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  addVersion: (id: string, data: unknown) =>
    request<CircuitDetail>(`/api/circuits/${id}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  assign: (id: string, data: unknown) =>
    request<CircuitAssignment>(`/api/circuits/${id}/assignments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAssignment: (id: string, data: unknown) =>
    request<CircuitAssignment>(`/api/circuit-assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id: string) => {
    const response = await fetch(`/api/circuits/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("No fue posible eliminar el circuito");
  },
};
