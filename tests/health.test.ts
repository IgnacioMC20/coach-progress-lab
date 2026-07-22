import { describe, expect, it, vi } from "vitest";
const { runCommandRaw } = vi.hoisted(() => ({ runCommandRaw: vi.fn() }));
vi.mock("@/server/db/prisma", () => ({
  prisma: { $runCommandRaw: runCommandRaw },
}));
import { GET } from "@/app/api/health/route";
describe("GET /api/health", () => {
  it("returns an OK payload", async () => {
    runCommandRaw.mockResolvedValue({ ok: 1 });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("returns a safe 503 when MongoDB cannot be reached", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    runCommandRaw.mockRejectedValue(new Error("Atlas connection failed"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Database temporarily unavailable",
      },
    });
    consoleError.mockRestore();
  });
});
