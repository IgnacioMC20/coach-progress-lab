"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/shared/empty-state";
import { RoutineBuilder } from "@/features/routines/components/routine-builder";
import { routineApi } from "@/features/routines/services/routine-api";

export default function NewRoutineVersionPage() {
  const { routineId } = useParams<{ routineId: string }>();
  const query = useQuery({
    queryKey: ["routine", routineId],
    queryFn: () => routineApi.get(routineId),
    enabled: Boolean(routineId),
  });
  if (query.isPending)
    return (
      <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-2xl border bg-white" />
    );
  if (query.isError || !query.data)
    return (
      <EmptyState
        title="No encontramos esta rutina"
        description="No es posible crear una versión desde esta dirección."
      />
    );
  return <RoutineBuilder routine={query.data} />;
}
