"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowLeft, CopyPlus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  circuitStatusLabel,
  circuitStatusTone,
} from "@/features/circuits/circuit-labels";
import { circuitApi } from "@/features/circuits/services/circuit-api";

function prescription(exercise: {
  reps: number | null;
  targetWeightKg: number | null;
  durationSeconds: number | null;
}) {
  const values = [
    exercise.reps ? `${exercise.reps} reps` : null,
    exercise.targetWeightKg !== null ? `${exercise.targetWeightKg} kg` : null,
    exercise.durationSeconds ? `${exercise.durationSeconds}s` : null,
  ].filter(Boolean);
  return values.join(" · ") || "Sin prescripción";
}
export function CircuitProfile() {
  const { circuitId } = useParams<{ circuitId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const circuit = useQuery({
    queryKey: ["circuit", circuitId],
    queryFn: () => circuitApi.get(circuitId),
    enabled: Boolean(circuitId),
  });
  const removal = useMutation({
    mutationFn: () => circuitApi.remove(circuitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["circuits"] });
      router.push("/circuits");
      router.refresh();
    },
  });
  if (circuit.isPending)
    return (
      <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-2xl border bg-white" />
    );
  if (circuit.isError || !circuit.data)
    return (
      <EmptyState
        title="No encontramos este circuito"
        description="Puede haber sido eliminado o la dirección no es válida."
      />
    );
  const data = circuit.data;
  const current = data.currentVersion;
  return (
    <section className="mx-auto max-w-5xl">
      <Link
        href="/circuits"
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} /> Volver a circuitos
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
        <div className="border-b border-slate-100 bg-slate-50/60 p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row">
            <div className="flex gap-4">
              <div className="bg-primary grid size-12 place-items-center rounded-2xl text-white">
                <Activity size={22} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                    Circuito versionado
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      circuitStatusTone[data.status],
                    )}
                  >
                    {circuitStatusLabel[data.status]}
                  </span>
                </div>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">
                  {data.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  {data.description ?? "Sin descripción adicional."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/circuits/${data.id}/new-version`}
                className="border-primary/35 text-primary inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-bold hover:bg-lavender/30"
              >
                <CopyPlus size={16} /> Nueva versión
              </Link>
              <Button
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() =>
                  window.confirm(
                    `¿Eliminar “${data.name}” y todas sus versiones?`,
                  ) && removal.mutate()
                }
                disabled={removal.isPending}
                aria-label="Eliminar circuito"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>
        {current ? (
          <div className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
                  Versión actual
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  v{current.version} · {current.rounds} rondas
                </h2>
              </div>
              <p className="rounded-lg bg-lavender/40 px-3 py-2 text-sm font-semibold text-primary">
                Descanso entre rondas: {current.restBetweenRoundsSeconds ?? 0}s
              </p>
            </div>
            {current.notes && (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                {current.notes}
              </p>
            )}
            <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {current.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div>
                    <p className="font-bold">
                      {exercise.position}. {exercise.exerciseName}
                    </p>
                    {exercise.notes && (
                      <p className="mt-1 text-xs text-slate-500">
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                  <p className="text-right text-sm font-semibold text-slate-600">
                    {prescription(exercise)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="Este circuito aún no tiene versiones"
              description="Crea una versión para poder asignarlo."
            />
          </div>
        )}
      </div>
    </section>
  );
}
