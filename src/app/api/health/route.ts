import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/errors/api-error";
import { toApiErrorResponse } from "@/server/errors/to-api-response";
export async function GET() {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Database healthcheck failed", error);
    return toApiErrorResponse(
      new ApiError(
        "DATABASE_UNAVAILABLE",
        "Database temporarily unavailable",
        503,
      ),
    );
  }
}
