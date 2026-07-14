import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findDefaultOrganization: vi.fn(),
  findActiveClients: vi.fn(),
  findExercises: vi.fn(),
}));

vi.mock("@/server/repositories/dashboard.repository", () => ({
  dashboardRepository: repository,
}));

import { dashboardService } from "@/server/services/dashboard.service";

function session(id: string, date: string, painLevel: number | null = null) {
  return {
    id,
    performedAt: new Date(date),
    exercises: [
      {
        exerciseId: "exercise-1",
        sets: [
          {
            position: 1,
            weightKg: 100,
            reps: 5,
            durationSeconds: null,
            rir: null,
            technique: null,
            painLevel,
            notes: null,
          },
        ],
      },
    ],
  };
}

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.findDefaultOrganization.mockResolvedValue({
      id: "organization-1",
    });
    repository.findExercises.mockResolvedValue([
      {
        id: "exercise-1",
        name: "Sentadilla",
        equipment: "BARBELL",
        minimumIncrement: 2.5,
      },
    ]);
  });

  it("derives weekly volume, prioritizes pain and preserves progress signals", async () => {
    repository.findActiveClients.mockResolvedValue([
      {
        id: "client-priority",
        firstName: "Ligia",
        lastName: "Morales",
        primaryGoal: "Hipertrofia",
        workoutSessions: [
          session("workout-1", "2026-07-07T16:30:00.000Z"),
          session("workout-2", "2026-07-09T16:30:00.000Z"),
          session("workout-3", "2026-07-11T16:30:00.000Z", 6),
        ],
        checkIns: [
          {
            id: "check-in-1",
            checkInDate: new Date("2026-07-12T12:00:00.000Z"),
          },
        ],
      },
      {
        id: "client-inactive",
        firstName: "Daniela",
        lastName: "Pérez",
        primaryGoal: null,
        workoutSessions: [],
        checkIns: [],
      },
    ] as never);

    const dashboard = await dashboardService.get(
      new Date("2026-07-13T12:00:00.000Z"),
    );

    expect(dashboard.summary).toEqual({
      activeClients: 2,
      completedWorkouts: 3,
      volumeKg: 1500,
      attentionClients: 2,
    });
    expect(dashboard.attention[0]).toMatchObject({
      clientId: "client-priority",
      reasons: [{ type: "PAIN" }, { type: "STAGNATION" }],
    });
    expect(
      dashboard.attention[1]?.reasons.map((reason) => reason.type),
    ).toEqual(["NO_WORKOUT", "NO_CHECK_IN"]);
    expect(dashboard.topProgress).toEqual([
      expect.objectContaining({
        clientId: "client-priority",
        personalRecords: 1,
      }),
    ]);
    expect(dashboard.recentActivity).toHaveLength(4);
    expect(dashboard.recentActivity[0]).toMatchObject({
      type: "CHECK_IN",
      id: "check-in-1",
    });
  });

  it("returns an empty dashboard when the workspace has not been set up", async () => {
    repository.findDefaultOrganization.mockResolvedValue(null);

    const dashboard = await dashboardService.get(
      new Date("2026-07-13T12:00:00.000Z"),
    );

    expect(dashboard.summary).toEqual({
      activeClients: 0,
      completedWorkouts: 0,
      volumeKg: 0,
      attentionClients: 0,
    });
  });
});
