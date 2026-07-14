import type { EquipmentType } from "@/features/exercises/types/exercise";

export type ProgressionAlert = {
  type: "PAIN" | "STAGNATION";
  message: string;
};

export type ProgressionSuggestion = {
  type: "INCREASE_LOAD" | "BUILD_REPS" | "NO_DATA";
  message: string;
};

export type ProgressionHistoryPoint = {
  date: string;
  e1RmKg: number | null;
  volumeKg: number;
  maxWeightKg: number | null;
};

export type ExerciseProgression = {
  exerciseId: string;
  exerciseName: string;
  equipment: EquipmentType | null;
  sessionCount: number;
  baselineE1RmKg: number | null;
  currentE1RmKg: number | null;
  bestE1RmKg: number | null;
  personalRecordAt: string | null;
  e1RmChangePercentage: number | null;
  totalVolumeKg: number;
  latestVolumeKg: number;
  maxWeightKg: number | null;
  suggestion: ProgressionSuggestion;
  alerts: ProgressionAlert[];
  history: ProgressionHistoryPoint[];
};

export type ProgressionDashboard = {
  clientId: string;
  clientName: string;
  exercises: ExerciseProgression[];
  summary: {
    totalVolumeKg: number;
    personalRecords: number;
    alerts: number;
    averageE1RmChangePercentage: number | null;
  };
};
