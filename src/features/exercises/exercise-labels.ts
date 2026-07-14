import type {
  EquipmentType,
  MeasurementType,
  MovementPattern,
  MuscleGroup,
  ProgressionPolicy,
} from "./types/exercise";

export const measurementTypeLabel: Record<MeasurementType, string> = {
  WEIGHT_REPS: "Carga y repeticiones",
  BODYWEIGHT_REPS: "Peso corporal y repeticiones",
  DURATION: "Duración",
  DISTANCE: "Distancia",
};

export const equipmentLabel: Record<EquipmentType, string> = {
  BARBELL: "Barra",
  DUMBBELL: "Mancuernas",
  KETTLEBELL: "Kettlebell",
  MACHINE: "Máquina",
  CABLE: "Polea",
  BAND: "Banda",
  BODYWEIGHT: "Peso corporal",
  OTHER: "Otro",
};

export const muscleLabel: Record<MuscleGroup, string> = {
  CHEST: "Pecho",
  BACK: "Espalda",
  SHOULDERS: "Hombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  QUADRICEPS: "Cuádriceps",
  HAMSTRINGS: "Isquiosurales",
  GLUTES: "Glúteos",
  CALVES: "Pantorrillas",
  CORE: "Core",
  FULL_BODY: "Cuerpo completo",
};

export const movementPatternLabel: Record<MovementPattern, string> = {
  SQUAT: "Sentadilla",
  HINGE: "Bisagra",
  HORIZONTAL_PUSH: "Empuje horizontal",
  VERTICAL_PUSH: "Empuje vertical",
  HORIZONTAL_PULL: "Tracción horizontal",
  VERTICAL_PULL: "Tracción vertical",
  LUNGE: "Zancada",
  CARRY: "Acarreo",
  ROTATION: "Rotación",
  ISOLATION: "Aislamiento",
};

export const progressionPolicyLabel: Record<ProgressionPolicy, string> = {
  DOUBLE_PROGRESSION: "Doble progresión",
  LOAD_FIRST: "Priorizar carga",
  REPETITIONS_FIRST: "Priorizar repeticiones",
  RIR_BASED: "Basada en RIR",
};
