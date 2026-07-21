import { NextRequest, NextResponse } from "next/server";
import { circuitVersionInputSchema } from "@/features/circuits/schemas/circuit.schema";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { circuitService } from "@/server/services/circuit.service";

type Context = { params: Promise<{ circuitId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json(
      {
        data: await circuitService.addVersion(
          objectIdSchema.parse((await params).circuitId),
          circuitVersionInputSchema.parse(await request.json()),
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
