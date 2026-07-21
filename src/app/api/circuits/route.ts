import { NextRequest, NextResponse } from "next/server";
import {
  circuitInputSchema,
  listCircuitsQuerySchema,
} from "@/features/circuits/schemas/circuit.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { circuitService } from "@/server/services/circuit.service";

export async function GET(request: NextRequest) {
  try {
    const query = listCircuitsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return NextResponse.json({ data: await circuitService.list(query) });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        data: await circuitService.create(
          circuitInputSchema.parse(await request.json()),
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
