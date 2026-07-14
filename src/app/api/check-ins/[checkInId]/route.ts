import { NextRequest, NextResponse } from "next/server";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";
import { checkInUpdateSchema } from "@/features/check-ins/schemas/check-in.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { checkInService } from "@/server/services/check-in.service";

type Context = { params: Promise<{ checkInId: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await checkInService.get(objectIdSchema.parse((await params).checkInId)),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await checkInService.update(
        objectIdSchema.parse((await params).checkInId),
        checkInUpdateSchema.parse(await request.json()),
      ),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Context) {
  try {
    await checkInService.remove(objectIdSchema.parse((await params).checkInId));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
