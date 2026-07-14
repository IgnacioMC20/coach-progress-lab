"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/shared/empty-state";
import { ExerciseForm } from "@/features/exercises/components/exercise-form";
import { exerciseApi } from "@/features/exercises/services/exercise-api";

export default function EditExercisePage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const query = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => exerciseApi.get(exerciseId),
    enabled: Boolean(exerciseId),
  });
  if (query.isPending)
    return (
      <div className="mx-auto h-96 max-w-4xl animate-pulse rounded-2xl border bg-white" />
    );
  if (query.isError || !query.data)
    return (
      <EmptyState
        title="No encontramos este ejercicio"
        description="No es posible editar una ficha que no está disponible."
      />
    );
  return <ExerciseForm exercise={query.data} />;
}
