import "server-only";
import { CURRENT_ONBOARDING_TOUR_VERSION } from "@/features/onboarding/onboarding-config";
import { ApiError } from "@/server/errors/api-error";
import { onboardingRepository } from "@/server/repositories/onboarding.repository";

function status(user: {
  onboardingTourVersion: number;
  onboardingTourSeenAt: Date | null;
}) {
  return {
    currentVersion: CURRENT_ONBOARDING_TOUR_VERSION,
    seen: user.onboardingTourVersion >= CURRENT_ONBOARDING_TOUR_VERSION,
    seenAt: user.onboardingTourSeenAt?.toISOString() ?? null,
  };
}

async function defaultUser() {
  const user = await onboardingRepository.findDefaultUser();
  if (!user)
    throw new ApiError(
      "SETUP_REQUIRED",
      "A user is required before saving onboarding progress",
      409,
    );
  return user;
}

export const onboardingService = {
  async get() {
    return status(await defaultUser());
  },
  async markSeen(now = new Date()) {
    const user = await defaultUser();
    return status(
      await onboardingRepository.markSeen(
        user.id,
        CURRENT_ONBOARDING_TOUR_VERSION,
        now,
      ),
    );
  },
};
