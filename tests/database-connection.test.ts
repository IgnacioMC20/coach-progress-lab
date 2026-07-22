import { describe, expect, it, vi } from "vitest";
import { toApiErrorResponse } from "@/server/errors/to-api-response";

describe("database connection errors", () => {
  it("returns a safe 503 for Atlas server selection failures", async () => {
    const response = toApiErrorResponse(
      new Error(
        "Server selection timeout: No available servers; received fatal alert: InternalError",
      ),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Database temporarily unavailable",
      },
    });
  });

  it("keeps unexpected errors as internal errors", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const response = toApiErrorResponse(new Error("unexpected failure"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
    consoleError.mockRestore();
  });
});
