import { NextResponse } from "next/server";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { onboardingService } from "@/server/services/onboarding.service";

export async function GET() {
  try {
    return NextResponse.json({ data: await onboardingService.get() });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function PATCH() {
  try {
    return NextResponse.json({ data: await onboardingService.markSeen() });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
