import { NextRequest, NextResponse } from "next/server";
import { circuitAssignmentUpdateSchema } from "@/features/circuits/schemas/circuit.schema";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { circuitService } from "@/server/services/circuit.service";

type Context = { params: Promise<{ assignmentId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await circuitService.updateAssignment(
        objectIdSchema.parse((await params).assignmentId),
        circuitAssignmentUpdateSchema.parse(await request.json()),
      ),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
