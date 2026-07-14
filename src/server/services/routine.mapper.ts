import "server-only";
import type { EquipmentType } from "@/features/exercises/types/exercise";
import type {
  Routine,
  RoutineAssignment,
  RoutineDetail,
  RoutineVersion,
} from "@/features/routines/types/routine";
import type {
  RoutineDetailRecord,
  RoutineListRecord,
  RoutineVersionRecord,
} from "@/server/repositories/routine.repository";

type ExerciseReference = { id: string; name: string; equipment: EquipmentType };

function toVersionDto(
  version: RoutineVersionRecord,
  exercises: Map<string, ExerciseReference>,
): RoutineVersion {
  return {
    id: version.id,
    version: version.version,
    notes: version.notes,
    createdAt: version.createdAt.toISOString(),
    days: version.days.map((day) => ({
      id: day.id,
      name: day.name,
      position: day.position,
      blocks: day.blocks.map((block) => ({
        id: block.id,
        name: block.name,
        type: block.type,
        position: block.position,
        restSeconds: block.restSeconds,
        exercises: block.exercises.map((entry) => {
          const exercise = exercises.get(entry.exerciseId);
          return {
            id: entry.id,
            exerciseId: entry.exerciseId,
            exerciseName: exercise?.name ?? "Ejercicio no disponible",
            equipment: exercise?.equipment ?? null,
            position: entry.position,
            sets: entry.sets,
            repsMin: entry.repsMin,
            repsMax: entry.repsMax,
            rir: entry.rir,
            restSeconds: entry.restSeconds,
            notes: entry.notes,
          };
        }),
      })),
    })),
  };
}

export function toRoutineDto(routine: RoutineListRecord): Routine {
  const latest = routine.versions[0] ?? null;
  return {
    id: routine.id,
    name: routine.name,
    description: routine.description,
    status: routine.status,
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
    latestVersion: latest?.version ?? null,
    dayCount: latest?._count.days ?? 0,
    assignmentCount: routine._count.assignments,
  };
}

export function toRoutineDetailDto(
  routine: RoutineDetailRecord,
  exercises: Map<string, ExerciseReference>,
): RoutineDetail {
  const current = routine.versions[0] ?? null;
  return {
    id: routine.id,
    name: routine.name,
    description: routine.description,
    status: routine.status,
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
    latestVersion: current?.version ?? null,
    dayCount: current?.days.length ?? 0,
    assignmentCount: routine.assignments.length,
    currentVersion: current ? toVersionDto(current, exercises) : null,
    versions: routine.versions.map((version) => ({
      id: version.id,
      version: version.version,
      notes: version.notes,
      createdAt: version.createdAt.toISOString(),
    })),
    assignments: routine.assignments.map<RoutineAssignment>((assignment) => ({
      id: assignment.id,
      clientId: assignment.clientId,
      clientName: `${assignment.client.firstName} ${assignment.client.lastName}`,
      status: assignment.status,
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate?.toISOString() ?? null,
      version: assignment.routineVersion.version,
    })),
  };
}
