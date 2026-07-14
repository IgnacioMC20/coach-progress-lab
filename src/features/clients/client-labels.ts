import type { ClientStatus, TrainingLevel } from "./types/client";
export const statusLabel: Record<ClientStatus, string> = {
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  COMPLETED: "Finalizado",
  ARCHIVED: "Archivado",
};
export const levelLabel: Record<TrainingLevel, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Experto",
};
export const statusTone: Record<ClientStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PAUSED: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-rose-50 text-rose-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
};
