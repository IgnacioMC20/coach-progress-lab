import { NextRequest, NextResponse } from "next/server";
import { circuitUpdateSchema } from "@/features/circuits/schemas/circuit.schema";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { circuitService } from "@/server/services/circuit.service";

type Context = { params: Promise<{ circuitId: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await circuitService.get(
        objectIdSchema.parse((await params).circuitId),
      ),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await circuitService.update(
        objectIdSchema.parse((await params).circuitId),
        circuitUpdateSchema.parse(await request.json()),
      ),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
export async function DELETE(_: NextRequest, { params }: Context) {
  try {
    await circuitService.remove(objectIdSchema.parse((await params).circuitId));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
