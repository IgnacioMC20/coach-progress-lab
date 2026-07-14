"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckInForm } from "@/features/check-ins/components/check-in-form";
import { checkInApi } from "@/features/check-ins/services/check-in-api";

export default function EditCheckInPage() {
  const { checkInId } = useParams<{ checkInId: string }>();
  const query = useQuery({
    queryKey: ["check-in", checkInId],
    queryFn: () => checkInApi.get(checkInId),
    enabled: Boolean(checkInId),
  });
  if (query.isPending)
    return (
      <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-2xl border bg-white" />
    );
  if (query.isError || !query.data)
    return (
      <EmptyState
        title="No encontramos este check-in"
        description="No es posible editar un registro no disponible."
      />
    );
  return <CheckInForm checkIn={query.data} />;
}
