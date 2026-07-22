import { describe, expect, it } from "vitest";
import {
  routineInputSchema,
  routineVersionInputSchema,
} from "@/features/routines/schemas/routine.schema";

const validRoutine = {
  name: "Base de fuerza",
  description: "Plantilla de prueba",
  status: "DRAFT",
  days: [
    {
      name: "Día A",
      blocks: [
        {
          type: "SUPERSET",
          exercises: [
            {
              exerciseId: "6a557679db9cc80c27e65c58",
              sets: "3",
              repsMin: "8",
              repsMax: "12",
              rir: "2",
              restSeconds: "90",
            },
          ],
        },
      ],
    },
  ],
};

describe("routine schemas", () => {
  it("parses a complete versioned routine payload", () => {
    const result = routineInputSchema.parse(validRoutine);
    expect(result.days[0]?.blocks[0]?.exercises[0]).toMatchObject({
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      rir: 2,
      restSeconds: 90,
    });
  });

  it("rejects an invalid repetition range and empty day structure", () => {
    expect(() =>
      routineVersionInputSchema.parse({
        days: [{ ...validRoutine.days[0], blocks: [] }],
      }),
    ).toThrow();
    const result = routineInputSchema.safeParse({
      ...validRoutine,
      days: [
        {
          ...validRoutine.days[0],
          blocks: [
            {
              ...validRoutine.days[0].blocks[0],
              exercises: [
                {
                  ...validRoutine.days[0].blocks[0].exercises[0],
                  repsMin: 12,
                  repsMax: 8,
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual([
        "days",
        0,
        "blocks",
        0,
        "exercises",
        0,
        "repsMax",
      ]);
      expect(result.error.issues[0]?.message).toContain("igual o mayor");
    }
  });
});
