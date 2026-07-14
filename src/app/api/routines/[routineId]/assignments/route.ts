import { NextRequest, NextResponse } from "next/server";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";
import { routineAssignmentInputSchema } from "@/features/routines/schemas/routine.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { routineService } from "@/server/services/routine.service";

type Context = { params: Promise<{ routineId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json(
      {
        data: await routineService.assign(
          objectIdSchema.parse((await params).routineId),
          routineAssignmentInputSchema.parse(await request.json()),
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
