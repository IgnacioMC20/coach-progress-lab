import { NextRequest, NextResponse } from "next/server";
import {
  checkInInputSchema,
  listCheckInsQuerySchema,
} from "@/features/check-ins/schemas/check-in.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { checkInService } from "@/server/services/check-in.service";

export async function GET(request: NextRequest) {
  try {
    const query = listCheckInsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return NextResponse.json({ data: await checkInService.list(query) });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = checkInInputSchema.parse(await request.json());
    return NextResponse.json(
      { data: await checkInService.create(input) },
      { status: 201 },
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
