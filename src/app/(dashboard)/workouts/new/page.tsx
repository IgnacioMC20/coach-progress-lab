import { Suspense } from "react";
import { WorkoutForm } from "@/features/workouts/components/workout-form";

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-100" />}>
      <WorkoutForm />
    </Suspense>
  );
}
