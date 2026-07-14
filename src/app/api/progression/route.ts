import { NextRequest, NextResponse } from "next/server";
import { progressionQuerySchema } from "@/features/progression/schemas/progression.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { progressionService } from "@/server/services/progression.service";

export async function GET(request: NextRequest) {
  try {
    const query = progressionQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return NextResponse.json({ data: await progressionService.get(query.clientId) });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
