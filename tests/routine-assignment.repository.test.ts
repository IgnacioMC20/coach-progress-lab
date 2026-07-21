import { describe, expect, it, vi } from "vitest";

const transaction = vi.hoisted(() => vi.fn());
const updateMany = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const findUniqueOrThrow = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: transaction,
    routineAssignment: { updateMany, create },
    routineTemplate: { findUniqueOrThrow },
    client: { update },
  },
}));

import { routineRepository } from "@/server/repositories/routine.repository";

describe("routine assignment replacement", () => {
  it("finishes active routines before assigning the new primary routine", async () => {
    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        routineAssignment: { updateMany, create },
        routineTemplate: { findUniqueOrThrow },
        client: { update },
      }),
    );
    create.mockResolvedValue({
      id: "assignment",
      client: {},
      routineVersion: {},
    });
    findUniqueOrThrow.mockResolvedValue({ name: "Fuerza base" });

    await routineRepository.assign("routine-id", {
      clientId: "6a557679db9cc80c27e65c54",
      routineVersionId: "6a557679db9cc80c27e65c58",
      startDate: undefined,
    });

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: "6a557679db9cc80c27e65c54", status: "ACTIVE" },
        data: expect.objectContaining({
          status: "COMPLETED",
          endDate: expect.any(Date),
        }),
      }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ routineId: "routine-id" }),
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currentProgram: "Fuerza base", currentWeek: 1 },
      }),
    );
  });
});
