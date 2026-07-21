import { describe, expect, it } from "vitest";
import {
  assessmentFormSchema,
  assessmentInputSchema,
  clientInputSchema,
  objectIdSchema,
} from "@/features/clients/schemas/client.schema";

describe("clientInputSchema", () => {
  it("normalizes optional values and parses valid client data", () => {
    const result = clientInputSchema.parse({
      firstName: "Ana",
      lastName: "Ruiz",
      email: "",
      birthDate: "1992-04-08",
      heightCm: "165",
      currentWeek: "3",
    });
    expect(result.email).toBeUndefined();
    expect(result.heightCm).toBe(165);
    expect(result.currentWeek).toBe(3);
    expect(result.birthDate).toBeInstanceOf(Date);
  });
  it("rejects an invalid height", () => {
    expect(() =>
      clientInputSchema.parse({
        firstName: "Ana",
        lastName: "Ruiz",
        heightCm: 40,
      }),
    ).toThrow();
  });
  it("accepts MongoDB ObjectIds and rejects invalid route parameters", () => {
    expect(objectIdSchema.parse("6a557679db9cc80c27e65c58")).toHaveLength(24);
    expect(() => objectIdSchema.parse("not-an-object-id")).toThrow();
  });
  it("keeps the assessment form date as a date-only transport value", () => {
    const form = assessmentFormSchema.parse({
      assessedAt: "2026-07-18",
      weightKg: "68.5",
    });
    const input = assessmentInputSchema.parse(form);
    expect(form.assessedAt).toBe("2026-07-18");
    expect(JSON.stringify(form)).toContain('"assessedAt":"2026-07-18"');
    expect(input.assessedAt).toBeInstanceOf(Date);
  });
});
