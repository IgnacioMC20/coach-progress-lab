import type { EquipmentType } from "@/features/exercises/types/exercise";

export type RoutineStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type RoutineBlockType = "STRAIGHT_SET" | "SUPERSET" | "CIRCUIT";
export type RoutineAssignmentStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export type RoutineExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  equipment: EquipmentType | null;
  position: number;
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
  restSeconds: number | null;
  notes: string | null;
};

export type RoutineBlock = {
  id: string;
  name: string | null;
  type: RoutineBlockType;
  position: number;
  restSeconds: number | null;
  exercises: RoutineExercise[];
};

export type RoutineDay = {
  id: string;
  name: string;
  position: number;
  blocks: RoutineBlock[];
};

export type RoutineVersion = {
  id: string;
  version: number;
  notes: string | null;
  createdAt: string;
  days: RoutineDay[];
};

export type RoutineAssignment = {
  id: string;
  clientId: string;
  clientName: string;
  status: RoutineAssignmentStatus;
  startDate: string;
  endDate: string | null;
  version: number;
};

export type Routine = {
  id: string;
  name: string;
  description: string | null;
  status: RoutineStatus;
  createdAt: string;
  updatedAt: string;
  latestVersion: number | null;
  dayCount: number;
  assignmentCount: number;
};

export type RoutineDetail = Routine & {
  currentVersion: RoutineVersion | null;
  versions: Array<{
    id: string;
    version: number;
    notes: string | null;
    createdAt: string;
  }>;
  assignments: RoutineAssignment[];
};

export type PaginatedRoutines = {
  items: Routine[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: { total: number; draft: number; published: number; assignments: number };
};
