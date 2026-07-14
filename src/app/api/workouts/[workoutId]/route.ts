import { NextRequest, NextResponse } from "next/server";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";
import { workoutUpdateSchema } from "@/features/workouts/schemas/workout.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { workoutService } from "@/server/services/workout.service";

type Context = { params: Promise<{ workoutId: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await workoutService.get(objectIdSchema.parse((await params).workoutId)),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await workoutService.update(
        objectIdSchema.parse((await params).workoutId),
        workoutUpdateSchema.parse(await request.json()),
      ),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Context) {
  try {
    await workoutService.remove(objectIdSchema.parse((await params).workoutId));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
