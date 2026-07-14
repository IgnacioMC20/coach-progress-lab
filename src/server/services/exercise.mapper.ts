import "server-only";
import type { Exercise, ExerciseReference } from "@/features/exercises/types/exercise";
import type { ExerciseRecord } from "@/server/repositories/exercise.repository";

export function toExerciseDto(
  exercise: ExerciseRecord,
  substituteById: Map<string, ExerciseReference>,
): Exercise {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    measurementType: exercise.measurementType,
    equipment: exercise.equipment,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    movementPattern: exercise.movementPattern,
    minimumIncrement: exercise.minimumIncrement,
    progressionPolicy: exercise.progressionPolicy,
    substitutes: exercise.substituteIds.flatMap((id) => {
      const substitute = substituteById.get(id);
      return substitute ? [substitute] : [];
    }),
    createdAt: exercise.createdAt.toISOString(),
    updatedAt: exercise.updatedAt.toISOString(),
  };
}
