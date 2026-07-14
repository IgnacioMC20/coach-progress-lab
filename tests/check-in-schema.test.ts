import { describe, expect, it } from "vitest";
import { checkInInputSchema } from "@/features/check-ins/schemas/check-in.schema";

const validCheckIn = {
  clientId: "6a557679db9cc80c27e65c54",
  checkInDate: "2026-07-14",
  weightKg: "62.4",
  sleepHours: "7.5",
  steps: "9500",
  energyLevel: "4",
  hungerLevel: "3",
  nutritionAdherence: "92",
};

describe("checkInInputSchema", () => {
  it("parses optional weekly measurements and recovery data", () => {
    const result = checkInInputSchema.parse(validCheckIn);
    expect(result.checkInDate).toBeInstanceOf(Date);
    expect(result).toMatchObject({
      weightKg: 62.4,
      sleepHours: 7.5,
      steps: 9500,
      energyLevel: 4,
      nutritionAdherence: 92,
    });
  });

  it("rejects values outside the weekly check-in scales", () => {
    expect(() => checkInInputSchema.parse({ ...validCheckIn, energyLevel: 6 })).toThrow();
    expect(() =>
      checkInInputSchema.parse({ ...validCheckIn, nutritionAdherence: 101 }),
    ).toThrow();
  });
});
