import { NextRequest, NextResponse } from "next/server";
import {
  assessmentInputSchema,
  objectIdSchema,
} from "@/features/clients/schemas/client.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { clientService } from "@/server/services/client.service";
type Context = { params: Promise<{ clientId: string }> };
export async function POST(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json(
      {
        data: await clientService.addAssessment(
          objectIdSchema.parse((await params).clientId),
          assessmentInputSchema.parse(await request.json()),
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
