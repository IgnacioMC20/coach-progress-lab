import type { TechniqueStatus, WorkoutSessionStatus } from "./types/workout";

export const workoutStatusLabel: Record<WorkoutSessionStatus, string> = {
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
};

export const workoutStatusTone: Record<WorkoutSessionStatus, string> = {
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

export const techniqueLabel: Record<TechniqueStatus, string> = {
  GOOD: "Correcta",
  ADJUSTED: "Con ajuste",
  NEEDS_ATTENTION: "Revisar",
};
