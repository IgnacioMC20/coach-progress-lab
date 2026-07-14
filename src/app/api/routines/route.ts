import { NextRequest, NextResponse } from "next/server";
import {
  listRoutinesQuerySchema,
  routineInputSchema,
} from "@/features/routines/schemas/routine.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { routineService } from "@/server/services/routine.service";

export async function GET(request: NextRequest) {
  try {
    const query = listRoutinesQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return NextResponse.json({ data: await routineService.list(query) });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = routineInputSchema.parse(await request.json());
    return NextResponse.json(
      { data: await routineService.create(input) },
      { status: 201 },
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
