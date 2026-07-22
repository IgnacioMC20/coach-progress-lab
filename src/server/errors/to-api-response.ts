import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./api-error";
import { isDatabaseConnectionError } from "./database-error";
export function toApiErrorResponse(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Revisa los campos marcados antes de continuar.",
          details: {
            issues: error.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
              code: issue.code,
            })),
          },
        },
      },
      { status: 400 },
    );
  if (error instanceof ApiError)
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  if (isDatabaseConnectionError(error)) {
    console.error(error);
    return NextResponse.json(
      {
        error: {
          code: "DATABASE_UNAVAILABLE",
          message:
            "La base de datos no está disponible temporalmente. Inténtalo de nuevo.",
        },
      },
      { status: 503 },
    );
  }
  console.error(error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Ocurrió un error inesperado. Inténtalo de nuevo.",
      },
    },
    { status: 500 },
  );
}
