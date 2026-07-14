import { NextRequest, NextResponse } from "next/server";
import {
  exerciseInputSchema,
  listExercisesQuerySchema,
} from "@/features/exercises/schemas/exercise.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { exerciseService } from "@/server/services/exercise.service";

export async function GET(request: NextRequest) {
  try {
    const query = listExercisesQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return NextResponse.json({ data: await exerciseService.list(query) });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = exerciseInputSchema.parse(await request.json());
    return NextResponse.json(
      { data: await exerciseService.create(input) },
      { status: 201 },
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
