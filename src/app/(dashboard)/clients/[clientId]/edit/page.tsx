"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ClientForm } from "@/features/clients/components/client-form";
import { EmptyState } from "@/components/shared/empty-state";
import { clientApi } from "@/features/clients/services/client-api";
export default function EditClientPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { data, isPending, isError } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => clientApi.get(clientId),
  });
  if (isPending)
    return <div className="h-120 animate-pulse rounded-2xl border bg-white" />;
  if (isError || !data) return <EmptyState title="No encontramos este cliente" />;
  return <ClientForm client={data} />;
}
