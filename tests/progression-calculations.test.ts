import { describe, expect, it } from "vitest";
import { calculateE1RmKg } from "@/features/progression/calculations";

describe("calculateE1RmKg", () => {
  it("uses the Epley formula and rounds to one decimal", () => {
    expect(calculateE1RmKg(100, 5)).toBe(116.7);
    expect(calculateE1RmKg(57.5, 8)).toBe(72.8);
  });
});
