import "server-only";
import type { ProgressionAlert } from "@/features/progression/types/progression";
import type {
  DashboardActivity,
  DashboardAttentionClient,
  DashboardAttentionType,
  DashboardProgressClient,
  ProgressDashboard,
} from "@/features/dashboard/types/dashboard";
import { dashboardRepository } from "@/server/repositories/dashboard.repository";
import { calculateProgression } from "@/server/services/progression.service";

const DAY_IN_MS = 24 * 60 * 60 * 1_000;

const attentionWeight: Record<DashboardAttentionType, number> = {
  PAIN: 4,
  STAGNATION: 3,
  NO_WORKOUT: 2,
  NO_CHECK_IN: 1,
};

function round(value: number) {
  return Number(value.toFixed(1));
}

function uniqueProgressionAlerts(alerts: ProgressionAlert[]) {
  return [...new Map(alerts.map((alert) => [alert.type, alert])).values()];
}

export const dashboardService = {
  async get(now = new Date()): Promise<ProgressDashboard> {
    const organization = await dashboardRepository.findDefaultOrganization();
    const periodStart = new Date(now.getTime() - 7 * DAY_IN_MS);
    if (!organization)
      return {
        periodStart: periodStart.toISOString(),
        summary: {
          activeClients: 0,
          completedWorkouts: 0,
          volumeKg: 0,
          attentionClients: 0,
        },
        attention: [],
        topProgress: [],
        recentActivity: [],
      };

    const clients = await dashboardRepository.findActiveClients(
      organization.id,
    );
    const exerciseIds = [
      ...new Set(
        clients.flatMap((client) =>
          client.workoutSessions.flatMap((session) =>
            session.exercises.map((exercise) => exercise.exerciseId),
          ),
        ),
      ),
    ];
    const references = await dashboardRepository.findExercises(
      exerciseIds,
      organization.id,
    );
    const attention: DashboardAttentionClient[] = [];
    const topProgress: DashboardProgressClient[] = [];
    const activity: DashboardActivity[] = [];
    let completedWorkouts = 0;
    let volumeKg = 0;

    for (const client of clients) {
      const progression = calculateProgression(
        client,
        client.workoutSessions,
        references,
      );
      const recentWorkouts = client.workoutSessions.filter(
        (workout) => workout.performedAt >= periodStart,
      );
      const recentCheckIns = client.checkIns.filter(
        (checkIn) => checkIn.checkInDate >= periodStart,
      );
      const lastWorkout = client.workoutSessions.at(-1) ?? null;
      const lastCheckIn = client.checkIns[0] ?? null;
      const reasons: DashboardAttentionClient["reasons"] =
        uniqueProgressionAlerts(
          progression.exercises.flatMap((exercise) => exercise.alerts),
        );

      if (!recentWorkouts.length)
        reasons.push({
          type: "NO_WORKOUT",
          message: "Sin sesión completada en los últimos 7 días.",
        });
      if (!recentCheckIns.length)
        reasons.push({
          type: "NO_CHECK_IN",
          message: "Sin check-in registrado en los últimos 7 días.",
        });

      if (reasons.length)
        attention.push({
          clientId: client.id,
          clientName: progression.clientName,
          primaryGoal: client.primaryGoal,
          lastWorkoutAt: lastWorkout?.performedAt.toISOString() ?? null,
          lastCheckInAt: lastCheckIn?.checkInDate.toISOString() ?? null,
          reasons,
        });
      if (progression.summary.averageE1RmChangePercentage !== null)
        topProgress.push({
          clientId: client.id,
          clientName: progression.clientName,
          averageE1RmChangePercentage:
            progression.summary.averageE1RmChangePercentage,
          personalRecords: progression.summary.personalRecords,
        });

      for (const workout of recentWorkouts) {
        completedWorkouts += 1;
        const sets = workout.exercises.flatMap((exercise) => exercise.sets);
        volumeKg += sets.reduce(
          (total, set) => total + (set.weightKg ?? 0) * (set.reps ?? 0),
          0,
        );
        activity.push({
          id: workout.id,
          type: "WORKOUT",
          clientName: progression.clientName,
          occurredAt: workout.performedAt.toISOString(),
          href: `/workouts/${workout.id}`,
          detail: `${workout.exercises.length} ejercicios · ${sets.length} series`,
        });
      }
      for (const checkIn of recentCheckIns)
        activity.push({
          id: checkIn.id,
          type: "CHECK_IN",
          clientName: progression.clientName,
          occurredAt: checkIn.checkInDate.toISOString(),
          href: `/check-ins/${checkIn.id}/edit`,
          detail: "Check-in semanal registrado",
        });
    }

    attention.sort((left, right) => {
      const leftWeight = Math.max(
        ...left.reasons.map((reason) => attentionWeight[reason.type]),
      );
      const rightWeight = Math.max(
        ...right.reasons.map((reason) => attentionWeight[reason.type]),
      );
      return (
        rightWeight - leftWeight ||
        right.reasons.length - left.reasons.length ||
        left.clientName.localeCompare(right.clientName, "es")
      );
    });
    topProgress.sort(
      (left, right) =>
        right.averageE1RmChangePercentage - left.averageE1RmChangePercentage ||
        right.personalRecords - left.personalRecords ||
        left.clientName.localeCompare(right.clientName, "es"),
    );
    activity.sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() -
        new Date(left.occurredAt).getTime(),
    );

    return {
      periodStart: periodStart.toISOString(),
      summary: {
        activeClients: clients.length,
        completedWorkouts,
        volumeKg: round(volumeKg),
        attentionClients: attention.length,
      },
      attention: attention.slice(0, 6),
      topProgress: topProgress.slice(0, 6),
      recentActivity: activity.slice(0, 6),
    };
  },
};
