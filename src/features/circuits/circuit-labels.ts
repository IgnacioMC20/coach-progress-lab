import type { CircuitAssignmentStatus, CircuitStatus } from "./types/circuit";

export const circuitStatusLabel: Record<CircuitStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};
export const circuitStatusTone: Record<CircuitStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
};
export const circuitAssignmentStatusLabel: Record<
  CircuitAssignmentStatus,
  string
> = {
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  COMPLETED: "Finalizada",
};
