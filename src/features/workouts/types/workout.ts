import type { EquipmentType } from "@/features/exercises/types/exercise";

export type WorkoutSessionStatus = "IN_PROGRESS" | "COMPLETED";
export type TechniqueStatus = "GOOD" | "ADJUSTED" | "NEEDS_ATTENTION";

export type WorkoutSet = {
  id: string;
  position: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  rir: number | null;
  technique: TechniqueStatus | null;
  painLevel: number | null;
  notes: string | null;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  equipment: EquipmentType | null;
  position: number;
  notes: string | null;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  clientId: string;
  clientName: string;
  performedAt: string;
  status: WorkoutSessionStatus;
  notes: string | null;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedWorkouts = {
  items: WorkoutSession[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: { sessions: number; completed: number; sets: number; volumeKg: number };
};
