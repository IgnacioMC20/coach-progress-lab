import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toApiErrorResponse } from "@/server/errors/to-api-response";

describe("API validation feedback", () => {
  it("returns Spanish messages and nested field paths", async () => {
    const schema = z.object({
      days: z.array(
        z.object({ name: z.string().min(2, "Escribe un nombre más largo") }),
      ),
    });
    const result = schema.safeParse({ days: [{ name: "" }] });
    if (result.success) throw new Error("El payload debía ser inválido");

    const response = toApiErrorResponse(result.error);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Revisa los campos marcados antes de continuar.",
        details: {
          issues: [
            {
              code: "too_small",
              message: "Escribe un nombre más largo",
              path: ["days", 0, "name"],
            },
          ],
        },
      },
    });
  });
});
