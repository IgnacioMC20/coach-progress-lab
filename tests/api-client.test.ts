import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import { applyApiError } from "@/lib/form-errors";

afterEach(() => vi.restoreAllMocks());

describe("API client form errors", () => {
  it("preserves validation codes and nested paths", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Revisa los campos marcados antes de continuar.",
            details: {
              issues: [
                {
                  path: ["days", 0, "name"],
                  message: "Escribe un nombre de al menos 2 caracteres",
                  code: "too_small",
                },
              ],
            },
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    );

    const error = await apiRequest("/api/routines").catch(
      (value: unknown) => value,
    );
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      code: "VALIDATION_ERROR",
      issues: [{ path: ["days", 0, "name"] }],
    });
  });

  it("maps server issues to fields and keeps a form-level fallback", () => {
    const setError = vi.fn();
    const error = new ApiClientError("Revisa los campos", "VALIDATION_ERROR", [
      {
        path: ["exercises", 1, "sets", 0, "reps"],
        message: "Registra repeticiones",
      },
    ]);

    applyApiError(error, setError);

    expect(setError).toHaveBeenCalledWith("exercises.1.sets.0.reps", {
      type: "server",
      message: "Registra repeticiones",
    });
    expect(setError).toHaveBeenCalledWith("root.server", {
      type: "server",
      message: "Revisa los campos",
    });
  });
});
