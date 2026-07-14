"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkoutForm } from "@/features/workouts/components/workout-form";
import { workoutApi } from "@/features/workouts/services/workout-api";

export default function EditWorkoutPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const query = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: () => workoutApi.get(workoutId),
    enabled: Boolean(workoutId),
  });
  if (query.isPending)
    return (
      <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-2xl border bg-white" />
    );
  if (query.isError || !query.data)
    return (
      <EmptyState
        title="No encontramos esta sesión"
        description="No es posible editar un registro no disponible."
      />
    );
  return <WorkoutForm workout={query.data} />;
}
