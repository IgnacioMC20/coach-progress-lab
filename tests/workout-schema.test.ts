import { describe, expect, it } from "vitest";
import { workoutInputSchema } from "@/features/workouts/schemas/workout.schema";

const validWorkout = {
  clientId: "6a557679db9cc80c27e65c58",
  performedAt: "2026-07-14",
  status: "COMPLETED",
  exercises: [
    {
      exerciseId: "6a557bbd4125188612e3fdb4",
      sets: [
        {
          weightKg: "60",
          reps: "8",
          rir: "2",
          technique: "",
          painLevel: "0",
        },
      ],
    },
  ],
};

describe("workoutInputSchema", () => {
  it("parses an executed set with performance data", () => {
    const result = workoutInputSchema.parse(validWorkout);
    const set = result.exercises[0]?.sets[0];
    expect(result.performedAt).toBeInstanceOf(Date);
    expect(set).toMatchObject({
      weightKg: 60,
      reps: 8,
      rir: 2,
      painLevel: 0,
      technique: undefined,
    });
  });

  it("requires at least one measurable value per set", () => {
    const result = workoutInputSchema.safeParse({
      ...validWorkout,
      exercises: [
        {
          ...validWorkout.exercises[0],
          sets: [{ technique: "GOOD" }],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]?.path).toEqual([
        "exercises",
        0,
        "sets",
        0,
        "reps",
      ]);
  });
});
