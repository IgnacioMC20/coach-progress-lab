import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./api-error";
export function toApiErrorResponse(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    { status: 500 },
  );
}
