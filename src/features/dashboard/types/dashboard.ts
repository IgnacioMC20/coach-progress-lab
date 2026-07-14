export type DashboardAttentionType =
  "PAIN" | "STAGNATION" | "NO_WORKOUT" | "NO_CHECK_IN";

export type DashboardAttentionClient = {
  clientId: string;
  clientName: string;
  primaryGoal: string | null;
  lastWorkoutAt: string | null;
  lastCheckInAt: string | null;
  reasons: { type: DashboardAttentionType; message: string }[];
};

export type DashboardProgressClient = {
  clientId: string;
  clientName: string;
  averageE1RmChangePercentage: number;
  personalRecords: number;
};

export type DashboardActivity = {
  id: string;
  type: "WORKOUT" | "CHECK_IN";
  clientName: string;
  occurredAt: string;
  href: string;
  detail: string;
};

export type ProgressDashboard = {
  periodStart: string;
  summary: {
    activeClients: number;
    completedWorkouts: number;
    volumeKg: number;
    attentionClients: number;
  };
  attention: DashboardAttentionClient[];
  topProgress: DashboardProgressClient[];
  recentActivity: DashboardActivity[];
};
