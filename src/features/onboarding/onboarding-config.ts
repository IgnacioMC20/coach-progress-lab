export const CURRENT_ONBOARDING_TOUR_VERSION = 2;

export type OnboardingTourStatus = {
  currentVersion: number;
  seen: boolean;
  seenAt: string | null;
};
