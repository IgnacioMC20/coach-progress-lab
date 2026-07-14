import "server-only";
import type {
  ExerciseProgression,
  ProgressionAlert,
  ProgressionDashboard,
  ProgressionHistoryPoint,
  ProgressionSuggestion,
} from "@/features/progression/types/progression";
import { calculateE1RmKg } from "@/features/progression/calculations";
import { ApiError } from "@/server/errors/api-error";
import {
  progressionRepository,
  type ProgressionSessionRecord,
} from "@/server/repositories/progression.repository";

type LoggedSet = ProgressionSessionRecord["exercises"][number]["sets"][number];
type ExerciseObservation = {
  date: Date;
  sets: LoggedSet[];
};
type ExerciseReference = Awaited<
  ReturnType<typeof progressionRepository.findExercises>
>[number];

const round = (value: number) => Number(value.toFixed(1));

function historyPoint(observation: ExerciseObservation): ProgressionHistoryPoint {
  const weightedSets = observation.sets.filter(
    (set) => set.weightKg !== null && set.reps !== null,
  );
  const e1Rms = weightedSets.map((set) => calculateE1RmKg(set.weightKg!, set.reps!));
  const weights = weightedSets.map((set) => set.weightKg!);
  return {
    date: observation.date.toISOString(),
    e1RmKg: e1Rms.length ? round(Math.max(...e1Rms)) : null,
    volumeKg: round(
      weightedSets.reduce((total, set) => total + set.weightKg! * set.reps!, 0),
    ),
    maxWeightKg: weights.length ? Math.max(...weights) : null,
  };
}

function suggestion(
  latest: ExerciseObservation | undefined,
  reference: ExerciseReference | undefined,
): ProgressionSuggestion {
  const weightedSets = latest?.sets.filter(
    (set) => set.weightKg !== null && set.reps !== null,
  );
  if (!weightedSets?.length || !reference)
    return {
      type: "NO_DATA",
      message: "Registra carga y repeticiones para sugerir progreso.",
    };
  const maxWeight = Math.max(...weightedSets.map((set) => set.weightKg!));
  const topSets = weightedSets.filter((set) => set.weightKg === maxWeight);
  if (reference.minimumIncrement && topSets.every((set) => set.reps! >= 12))
    return {
      type: "INCREASE_LOAD",
      message: `Sube ${reference.minimumIncrement} kg en la próxima sesión.`,
    };
  return {
    type: "BUILD_REPS",
    message: `Mantén ${maxWeight} kg y busca acumular 8–12 repeticiones de calidad.`,
  };
}

function alerts(
  history: ProgressionHistoryPoint[],
  observations: ExerciseObservation[],
): ProgressionAlert[] {
  const result: ProgressionAlert[] = [];
  const latestDate = observations.at(-1)?.date;
  if (!latestDate) return result;
  const recentCutoff = new Date(latestDate.getTime() - 14 * 24 * 60 * 60 * 1_000);
  const pain = observations
    .filter((observation) => observation.date >= recentCutoff)
    .flatMap((observation) => observation.sets)
    .reduce<number | null>(
      (highest, set) =>
        set.painLevel !== null && (highest === null || set.painLevel > highest)
          ? set.painLevel
          : highest,
      null,
    );
  if (pain !== null && pain >= 5)
    result.push({ type: "PAIN", message: `Dolor ${pain}/10 reportado recientemente.` });

  const recentE1Rms = history.filter((point) => point.e1RmKg !== null).slice(-3);
  if (recentE1Rms.length === 3) {
    const previousBest = Math.max(
      ...recentE1Rms.slice(0, -1).map((point) => point.e1RmKg ?? 0),
    );
    const latest = recentE1Rms[2]?.e1RmKg;
    if (latest !== null && latest !== undefined && latest <= previousBest * 1.005)
      result.push({
        type: "STAGNATION",
        message: "Sin mejora de e1RM en las últimas tres exposiciones.",
      });
  }
  return result;
}

function buildExercise(
  exerciseId: string,
  observations: ExerciseObservation[],
  reference: ExerciseReference | undefined,
): ExerciseProgression {
  const history = observations.map(historyPoint);
  const measured = history.filter((point) => point.e1RmKg !== null);
  const baseline = measured[0]?.e1RmKg ?? null;
  const current = measured.at(-1)?.e1RmKg ?? null;
  const best = measured.reduce<ProgressionHistoryPoint | undefined>(
    (bestPoint, point) =>
      !bestPoint || point.e1RmKg! > bestPoint.e1RmKg! ? point : bestPoint,
    undefined,
  );
  const change =
    baseline && current ? round(((current - baseline) / baseline) * 100) : null;
  return {
    exerciseId,
    exerciseName: reference?.name ?? "Ejercicio no disponible",
    equipment: reference?.equipment ?? null,
    sessionCount: observations.length,
    baselineE1RmKg: baseline,
    currentE1RmKg: current,
    bestE1RmKg: best?.e1RmKg ?? null,
    personalRecordAt: best?.date ?? null,
    e1RmChangePercentage: change,
    totalVolumeKg: round(history.reduce((total, point) => total + point.volumeKg, 0)),
    latestVolumeKg: history.at(-1)?.volumeKg ?? 0,
    maxWeightKg:
      Math.max(
        ...history.flatMap((point) => (point.maxWeightKg ? [point.maxWeightKg] : [])),
        0,
      ) || null,
    suggestion: suggestion(observations.at(-1), reference),
    alerts: alerts(history, observations),
    history,
  };
}

export const progressionService = {
  async get(clientId: string): Promise<ProgressionDashboard> {
    const organization = await progressionRepository.findDefaultOrganization();
    if (!organization)
      throw new ApiError(
        "SETUP_REQUIRED",
        "An organization is required before calculating progression",
        409,
      );
    const client = await progressionRepository.findClient(clientId, organization.id);
    if (!client) throw new ApiError("NOT_FOUND", "Client not found", 404);
    const sessions = await progressionRepository.findCompletedSessions(
      client.id,
      organization.id,
    );
    const observations = new Map<string, ExerciseObservation[]>();
    for (const session of sessions) {
      for (const exercise of session.exercises) {
        const current = observations.get(exercise.exerciseId) ?? [];
        current.push({ date: session.performedAt, sets: exercise.sets });
        observations.set(exercise.exerciseId, current);
      }
    }
    const exerciseIds = [...observations.keys()];
    const references = await progressionRepository.findExercises(
      exerciseIds,
      organization.id,
    );
    const referenceMap = new Map(references.map((exercise) => [exercise.id, exercise]));
    const exercises = exerciseIds
      .map((exerciseId) =>
        buildExercise(
          exerciseId,
          observations.get(exerciseId)!,
          referenceMap.get(exerciseId),
        ),
      )
      .sort((left, right) => right.totalVolumeKg - left.totalVolumeKg);
    const changes = exercises.flatMap((exercise) =>
      exercise.e1RmChangePercentage === null ? [] : [exercise.e1RmChangePercentage],
    );
    return {
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      exercises,
      summary: {
        totalVolumeKg: round(
          exercises.reduce((total, exercise) => total + exercise.totalVolumeKg, 0),
        ),
        personalRecords: exercises.filter((exercise) => exercise.bestE1RmKg !== null)
          .length,
        alerts: exercises.reduce((total, exercise) => total + exercise.alerts.length, 0),
        averageE1RmChangePercentage: changes.length
          ? round(changes.reduce((total, value) => total + value, 0) / changes.length)
          : null,
      },
    };
  },
};
