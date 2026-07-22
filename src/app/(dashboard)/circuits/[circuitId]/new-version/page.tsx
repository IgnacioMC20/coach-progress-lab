"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/shared/empty-state";
import { CircuitBuilder } from "@/features/circuits/components/circuit-builder";
import { circuitApi } from "@/features/circuits/services/circuit-api";

export default function NewCircuitVersionPage() {
  const { circuitId } = useParams<{ circuitId: string }>();
  const query = useQuery({
    queryKey: ["circuit", circuitId],
    queryFn: () => circuitApi.get(circuitId),
    enabled: Boolean(circuitId),
  });
  if (query.isPending)
    return (
      <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-2xl border bg-white" />
    );
  if (query.isError || !query.data)
    return (
      <EmptyState
        title="No encontramos este circuito"
        description="No es posible crear una versión desde esta dirección."
      />
    );
  return <CircuitBuilder circuit={query.data} />;
}
