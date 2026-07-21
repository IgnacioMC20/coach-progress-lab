import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findDefaultUser: vi.fn(),
  markSeen: vi.fn(),
}));

vi.mock("@/server/repositories/onboarding.repository", () => ({
  onboardingRepository: repository,
}));

import { onboardingService } from "@/server/services/onboarding.service";

describe("onboardingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports the current tour as unseen for a new user", async () => {
    repository.findDefaultUser.mockResolvedValue({
      id: "user-1",
      onboardingTourVersion: 0,
      onboardingTourSeenAt: null,
    });

    await expect(onboardingService.get()).resolves.toEqual({
      currentVersion: 2,
      seen: false,
      seenAt: null,
    });
  });

  it("shows the updated tour once to users who completed version one", async () => {
    repository.findDefaultUser.mockResolvedValue({
      id: "user-1",
      onboardingTourVersion: 1,
      onboardingTourSeenAt: new Date("2026-07-14T18:00:00.000Z"),
    });

    await expect(onboardingService.get()).resolves.toEqual({
      currentVersion: 2,
      seen: false,
      seenAt: "2026-07-14T18:00:00.000Z",
    });
  });

  it("marks the current version as seen with an idempotent update", async () => {
    const seenAt = new Date("2026-07-14T18:00:00.000Z");
    repository.findDefaultUser.mockResolvedValue({
      id: "user-1",
      onboardingTourVersion: 0,
      onboardingTourSeenAt: null,
    });
    repository.markSeen.mockResolvedValue({
      id: "user-1",
      onboardingTourVersion: 2,
      onboardingTourSeenAt: seenAt,
    });

    await expect(onboardingService.markSeen(seenAt)).resolves.toEqual({
      currentVersion: 2,
      seen: true,
      seenAt: seenAt.toISOString(),
    });
    expect(repository.markSeen).toHaveBeenCalledWith("user-1", 2, seenAt);
  });

  it("requires a default user before reading onboarding state", async () => {
    repository.findDefaultUser.mockResolvedValue(null);

    await expect(onboardingService.get()).rejects.toMatchObject({
      code: "SETUP_REQUIRED",
      status: 409,
    });
  });
});
