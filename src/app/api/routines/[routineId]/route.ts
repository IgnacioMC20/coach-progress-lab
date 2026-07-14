import { NextRequest, NextResponse } from "next/server";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";
import { routineUpdateSchema } from "@/features/routines/schemas/routine.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { routineService } from "@/server/services/routine.service";

type Context = { params: Promise<{ routineId: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await routineService.get(objectIdSchema.parse((await params).routineId)),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await routineService.update(
        objectIdSchema.parse((await params).routineId),
        routineUpdateSchema.parse(await request.json()),
      ),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Context) {
  try {
    await routineService.remove(objectIdSchema.parse((await params).routineId));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
