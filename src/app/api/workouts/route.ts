import { NextRequest, NextResponse } from "next/server";
import {
  listWorkoutsQuerySchema,
  workoutInputSchema,
} from "@/features/workouts/schemas/workout.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { workoutService } from "@/server/services/workout.service";

export async function GET(request: NextRequest) {
  try {
    const query = listWorkoutsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return NextResponse.json({ data: await workoutService.list(query) });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = workoutInputSchema.parse(await request.json());
    return NextResponse.json(
      { data: await workoutService.create(input) },
      { status: 201 },
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
