import type {
  Circuit,
  CircuitAssignment,
  CircuitDetail,
  CircuitVersion,
} from "@/features/circuits/types/circuit";
import type {
  CircuitDetailRecord,
  CircuitListRecord,
  CircuitVersionRecord,
} from "@/server/repositories/circuit.repository";

function toVersion(
  version: CircuitVersionRecord,
  exerciseNames: Map<
    string,
    {
      name: string;
      equipment: CircuitVersion["exercises"][number]["equipment"];
    }
  >,
): CircuitVersion {
  return {
    id: version.id,
    version: version.version,
    rounds: version.rounds,
    restBetweenRoundsSeconds: version.restBetweenRoundsSeconds,
    notes: version.notes,
    createdAt: version.createdAt.toISOString(),
    exercises: version.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      exerciseName:
        exerciseNames.get(exercise.exerciseId)?.name ?? "Ejercicio eliminado",
      equipment: exerciseNames.get(exercise.exerciseId)?.equipment ?? null,
      position: exercise.position,
      reps: exercise.reps,
      targetWeightKg: exercise.targetWeightKg,
      durationSeconds: exercise.durationSeconds,
      notes: exercise.notes,
    })),
  };
}

export function toCircuitDto(circuit: CircuitListRecord): Circuit {
  const latest = circuit.versions[0] ?? null;
  return {
    id: circuit.id,
    name: circuit.name,
    description: circuit.description,
    status: circuit.status,
    createdAt: circuit.createdAt.toISOString(),
    updatedAt: circuit.updatedAt.toISOString(),
    latestVersion: latest?.version ?? null,
    exerciseCount: latest?._count.exercises ?? 0,
    assignmentCount: circuit._count.assignments,
  };
}

export function toCircuitDetailDto(
  circuit: CircuitDetailRecord,
  exerciseNames: Map<
    string,
    {
      name: string;
      equipment: CircuitVersion["exercises"][number]["equipment"];
    }
  >,
): CircuitDetail {
  const current = circuit.versions[0] ?? null;
  return {
    id: circuit.id,
    name: circuit.name,
    description: circuit.description,
    status: circuit.status,
    createdAt: circuit.createdAt.toISOString(),
    updatedAt: circuit.updatedAt.toISOString(),
    latestVersion: current?.version ?? null,
    exerciseCount: current?.exercises.length ?? 0,
    assignmentCount: circuit.assignments.length,
    currentVersion: current ? toVersion(current, exerciseNames) : null,
    versions: circuit.versions.map((version) => ({
      id: version.id,
      version: version.version,
      notes: version.notes,
      createdAt: version.createdAt.toISOString(),
    })),
    assignments: circuit.assignments.map<CircuitAssignment>((assignment) => ({
      id: assignment.id,
      clientId: assignment.clientId,
      clientName: `${assignment.client.firstName} ${assignment.client.lastName}`,
      status: assignment.status,
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate?.toISOString() ?? null,
      version: assignment.circuitVersion.version,
    })),
  };
}
