import "server-only";
import type { EquipmentType } from "@/features/exercises/types/exercise";
import type { WorkoutSession } from "@/features/workouts/types/workout";
import type { WorkoutRecord } from "@/server/repositories/workout.repository";

type ExerciseReference = { id: string; name: string; equipment: EquipmentType };

export function toWorkoutDto(
  workout: WorkoutRecord,
  exercises: Map<string, ExerciseReference>,
): WorkoutSession {
  return {
    id: workout.id,
    clientId: workout.clientId,
    clientName: `${workout.client.firstName} ${workout.client.lastName}`,
    performedAt: workout.performedAt.toISOString(),
    status: workout.status,
    notes: workout.notes,
    exercises: workout.exercises.map((exercise) => {
      const reference = exercises.get(exercise.exerciseId);
      return {
        id: exercise.id,
        exerciseId: exercise.exerciseId,
        exerciseName: reference?.name ?? "Ejercicio no disponible",
        equipment: reference?.equipment ?? null,
        position: exercise.position,
        notes: exercise.notes,
        sets: exercise.sets.map((set) => ({
          id: set.id,
          position: set.position,
          weightKg: set.weightKg,
          reps: set.reps,
          durationSeconds: set.durationSeconds,
          rir: set.rir,
          technique: set.technique,
          painLevel: set.painLevel,
          notes: set.notes,
        })),
      };
    }),
    createdAt: workout.createdAt.toISOString(),
    updatedAt: workout.updatedAt.toISOString(),
  };
}
