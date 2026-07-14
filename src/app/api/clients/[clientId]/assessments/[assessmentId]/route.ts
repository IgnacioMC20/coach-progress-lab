import { NextRequest, NextResponse } from "next/server";
import {
  assessmentInputSchema,
  objectIdSchema,
} from "@/features/clients/schemas/client.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { clientService } from "@/server/services/client.service";

type Context = { params: Promise<{ clientId: string; assessmentId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { clientId, assessmentId } = await params;
    return NextResponse.json({
      data: await clientService.updateAssessment(
        objectIdSchema.parse(clientId),
        objectIdSchema.parse(assessmentId),
        assessmentInputSchema.parse(await request.json()),
      ),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
