import { NextRequest, NextResponse } from "next/server";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";
import { routineAssignmentUpdateSchema } from "@/features/routines/schemas/routine.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { routineService } from "@/server/services/routine.service";

type Context = { params: Promise<{ assignmentId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await routineService.updateAssignment(
        objectIdSchema.parse((await params).assignmentId),
        routineAssignmentUpdateSchema.parse(await request.json()),
      ),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
