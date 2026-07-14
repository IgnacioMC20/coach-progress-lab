import { NextRequest, NextResponse } from "next/server";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";
import { exerciseUpdateSchema } from "@/features/exercises/schemas/exercise.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { exerciseService } from "@/server/services/exercise.service";

type Context = { params: Promise<{ exerciseId: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await exerciseService.get(objectIdSchema.parse((await params).exerciseId)),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await exerciseService.update(
        objectIdSchema.parse((await params).exerciseId),
        exerciseUpdateSchema.parse(await request.json()),
      ),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Context) {
  try {
    await exerciseService.remove(objectIdSchema.parse((await params).exerciseId));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
