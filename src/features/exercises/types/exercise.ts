export type MeasurementType = "WEIGHT_REPS" | "BODYWEIGHT_REPS" | "DURATION" | "DISTANCE";
export type EquipmentType =
  | "BARBELL"
  | "DUMBBELL"
  | "KETTLEBELL"
  | "MACHINE"
  | "CABLE"
  | "BAND"
  | "BODYWEIGHT"
  | "OTHER";
export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "SHOULDERS"
  | "BICEPS"
  | "TRICEPS"
  | "QUADRICEPS"
  | "HAMSTRINGS"
  | "GLUTES"
  | "CALVES"
  | "CORE"
  | "FULL_BODY";
export type MovementPattern =
  | "SQUAT"
  | "HINGE"
  | "HORIZONTAL_PUSH"
  | "VERTICAL_PUSH"
  | "HORIZONTAL_PULL"
  | "VERTICAL_PULL"
  | "LUNGE"
  | "CARRY"
  | "ROTATION"
  | "ISOLATION";
export type ProgressionPolicy =
  "DOUBLE_PROGRESSION" | "LOAD_FIRST" | "REPETITIONS_FIRST" | "RIR_BASED";

export type ExerciseReference = { id: string; name: string; equipment: EquipmentType };

export type Exercise = {
  id: string;
  name: string;
  description: string | null;
  measurementType: MeasurementType;
  equipment: EquipmentType;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  movementPattern: MovementPattern;
  minimumIncrement: number | null;
  progressionPolicy: ProgressionPolicy;
  substitutes: ExerciseReference[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedExercises = {
  items: Exercise[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    total: number;
    weighted: number;
    bodyweight: number;
    withSubstitutions: number;
  };
};
