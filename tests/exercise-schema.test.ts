import { describe, expect, it } from "vitest";
import {
  exerciseInputSchema,
  exerciseUpdateSchema,
} from "@/features/exercises/schemas/exercise.schema";

const validExercise = {
  name: "Press con mancuernas",
  measurementType: "WEIGHT_REPS",
  equipment: "DUMBBELL",
  primaryMuscles: ["CHEST"],
  movementPattern: "HORIZONTAL_PUSH",
  progressionPolicy: "DOUBLE_PROGRESSION",
};

describe("exerciseInputSchema", () => {
  it("normalizes optional values and accepts valid exercise data", () => {
    const result = exerciseInputSchema.parse({
      ...validExercise,
      description: "",
      minimumIncrement: "2.5",
    });

    expect(result.description).toBeUndefined();
    expect(result.minimumIncrement).toBe(2.5);
    expect(result.secondaryMuscles).toEqual([]);
    expect(result.substituteIds).toEqual([]);
  });

  it("rejects invalid increments and duplicate substitutes", () => {
    expect(() =>
      exerciseInputSchema.parse({ ...validExercise, minimumIncrement: 0 }),
    ).toThrow();
    expect(() =>
      exerciseInputSchema.parse({
        ...validExercise,
        substituteIds: ["6a557679db9cc80c27e65c58", "6a557679db9cc80c27e65c58"],
      }),
    ).toThrow();
  });

  it("keeps omitted collections absent for partial updates", () => {
    expect(exerciseUpdateSchema.parse({ minimumIncrement: 1.5 })).toEqual({
      minimumIncrement: 1.5,
    });
  });
});
