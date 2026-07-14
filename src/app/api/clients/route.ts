import { NextRequest, NextResponse } from "next/server";
import {
  clientInputSchema,
  listClientsQuerySchema,
} from "@/features/clients/schemas/client.schema";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
import { clientService } from "@/server/services/client.service";
export async function GET(request: NextRequest) {
  try {
    const query = listClientsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return NextResponse.json({ data: await clientService.list(query) });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const input = clientInputSchema.parse(await request.json());
    return NextResponse.json(
      { data: await clientService.create(input) },
      { status: 201 },
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
