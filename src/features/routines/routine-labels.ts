import type {
  RoutineAssignmentStatus,
  RoutineBlockType,
  RoutineStatus,
} from "./types/routine";

export const routineStatusLabel: Record<RoutineStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
  ARCHIVED: "Archivada",
};

export const routineStatusTone: Record<RoutineStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
};

export const blockTypeLabel: Record<RoutineBlockType, string> = {
  STRAIGHT_SET: "Series rectas",
  SUPERSET: "Superserie",
  CIRCUIT: "Circuito",
};

export const assignmentStatusLabel: Record<RoutineAssignmentStatus, string> = {
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  COMPLETED: "Finalizada",
};
