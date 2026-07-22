import type { EquipmentType } from "@/features/exercises/types/exercise";

export type CircuitStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CircuitAssignmentStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export type CircuitExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  equipment: EquipmentType | null;
  position: number;
  reps: number | null;
  targetWeightKg: number | null;
  durationSeconds: number | null;
  notes: string | null;
};
export type CircuitVersion = {
  id: string;
  version: number;
  rounds: number;
  restBetweenRoundsSeconds: number | null;
  notes: string | null;
  createdAt: string;
  exercises: CircuitExercise[];
};
export type CircuitAssignment = {
  id: string;
  clientId: string;
  clientName: string;
  status: CircuitAssignmentStatus;
  startDate: string;
  endDate: string | null;
  version: number;
};
export type Circuit = {
  id: string;
  name: string;
  description: string | null;
  status: CircuitStatus;
  createdAt: string;
  updatedAt: string;
  latestVersion: number | null;
  exerciseCount: number;
  assignmentCount: number;
};
export type CircuitDetail = Circuit & {
  currentVersion: CircuitVersion | null;
  versions: Array<{
    id: string;
    version: number;
    createdAt: string;
    notes: string | null;
  }>;
  assignments: CircuitAssignment[];
};
export type PaginatedCircuits = {
  items: Circuit[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    total: number;
    draft: number;
    published: number;
    assignments: number;
  };
};
