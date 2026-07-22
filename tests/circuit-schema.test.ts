import { describe, expect, it } from "vitest";
import {
  circuitInputSchema,
  circuitVersionInputSchema,
} from "@/features/circuits/schemas/circuit.schema";

const circuit = {
  name: "Finisher de potencia",
  description: "Circuito corto",
  rounds: "4",
  restBetweenRoundsSeconds: "75",
  exercises: [
    {
      exerciseId: "6a557679db9cc80c27e65c58",
      reps: "12",
      targetWeightKg: "16",
    },
  ],
};

describe("circuit schemas", () => {
  it("parses a reusable circuit and its exercise prescriptions", () => {
    const result = circuitInputSchema.parse(circuit);
    expect(result).toMatchObject({
      rounds: 4,
      restBetweenRoundsSeconds: 75,
      exercises: [{ reps: 12, targetWeightKg: 16 }],
    });
  });

  it("requires a prescription and at least one exercise in every version", () => {
    const prescription = circuitVersionInputSchema.safeParse({
      rounds: 3,
      exercises: [{ exerciseId: "6a557679db9cc80c27e65c58" }],
    });
    expect(prescription.success).toBe(false);
    if (!prescription.success)
      expect(prescription.error.issues[0]?.path).toEqual([
        "exercises",
        0,
        "reps",
      ]);
    expect(() =>
      circuitVersionInputSchema.parse({ rounds: 3, exercises: [] }),
    ).toThrow();
  });
});
