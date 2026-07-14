import { NextRequest, NextResponse } from "next/server";
import {
  clientUpdateSchema,
  objectIdSchema,
} from "@/features/clients/schemas/client.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { clientService } from "@/server/services/client.service";
type Context = { params: Promise<{ clientId: string }> };
export async function GET(_: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await clientService.get(objectIdSchema.parse((await params).clientId)),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return NextResponse.json({
      data: await clientService.update(
        objectIdSchema.parse((await params).clientId),
        clientUpdateSchema.parse(await request.json()),
      ),
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
export async function DELETE(_: NextRequest, { params }: Context) {
  try {
    await clientService.remove(objectIdSchema.parse((await params).clientId));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
