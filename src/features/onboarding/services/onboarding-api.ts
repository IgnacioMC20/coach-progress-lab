import type { OnboardingTourStatus } from "@/features/onboarding/onboarding-config";

async function parseStatus(response: Response): Promise<OnboardingTourStatus> {
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      body?.error?.message ?? "No fue posible actualizar el recorrido guiado",
    );
  return body.data as OnboardingTourStatus;
}

export const onboardingApi = {
  async getStatus() {
    return parseStatus(
      await fetch("/api/onboarding-tour", { cache: "no-store" }),
    );
  },
  async markSeen() {
    return parseStatus(
      await fetch("/api/onboarding-tour", {
        method: "PATCH",
        keepalive: true,
      }),
    );
  },
};
