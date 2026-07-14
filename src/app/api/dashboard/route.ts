import { NextResponse } from "next/server";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { dashboardService } from "@/server/services/dashboard.service";

export async function GET() {
  try {
    return NextResponse.json({ data: await dashboardService.get() });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
