"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Dumbbell,
  GitCompareArrows,
  Pencil,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { Button } from "@/components/ui/button";
import {
  equipmentLabel,
  measurementTypeLabel,
  movementPatternLabel,
  muscleLabel,
  progressionPolicyLabel,
} from "@/features/exercises/exercise-labels";
import { exerciseApi } from "@/features/exercises/services/exercise-api";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

export function ExerciseProfile() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => exerciseApi.get(exerciseId),
    enabled: Boolean(exerciseId),
  });
  const remove = useMutation({
    mutationFn: () => exerciseApi.remove(exerciseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["exercises"] });
      router.push("/exercises");
      router.refresh();
    },
  });
  if (query.isPending)
    return (
      <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-2xl border bg-white" />
    );
  if (query.isError || !query.data)
    return (
      <EmptyState
        title="No encontramos este ejercicio"
        description="Puede haberse eliminado o la dirección no es válida."
      />
    );
  const exercise = query.data;
  const confirmDelete = () => {
    if (
      window.confirm(
        `¿Eliminar “${exercise.name}”? Se retirará también de las sustituciones de otros ejercicios.`,
      )
    )
      remove.mutate();
  };

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        href="/exercises"
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} />
        Volver a ejercicios
      </Link>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
        <div className="from-lavender/50 to-blue/30 border-b border-slate-100 bg-gradient-to-r via-white px-6 py-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex gap-4">
              <div className="bg-primary shadow-primary/20 grid size-13 shrink-0 place-items-center rounded-2xl text-white shadow-lg">
                <Dumbbell size={24} />
              </div>
              <div>
                <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                  Ficha de ejercicio
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  {exercise.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {exercise.description ?? "Sin descripción adicional."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/exercises/${exercise.id}/edit`}
                className="border-primary/35 text-primary hover:bg-lavender/30 inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-bold"
              >
                <Pencil size={16} />
                Editar
              </Link>
              <Button
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={confirmDelete}
                disabled={remove.isPending}
                aria-label="Eliminar ejercicio"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Configuración de prescripción
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Detail
                label="Tipo de medición"
                value={measurementTypeLabel[exercise.measurementType]}
              />
              <Detail
                label="Equipo"
                value={equipmentLabel[exercise.equipment]}
              />
              <Detail
                label="Patrón"
                value={movementPatternLabel[exercise.movementPattern]}
              />
              <Detail
                label="Política"
                value={
                  exercise.progressionPolicy === "RIR_BASED" ? (
                    <>
                      Basada en <TermTooltip term="RIR" />
                    </>
                  ) : (
                    progressionPolicyLabel[exercise.progressionPolicy]
                  )
                }
              />
              <Detail
                label="Incremento mínimo"
                value={
                  exercise.minimumIncrement
                    ? `${exercise.minimumIncrement} kg`
                    : "No aplica"
                }
              />
              <Detail
                label="Sustituciones"
                value={`${exercise.substitutes.length} registradas`}
              />
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-bold">Grupos musculares</h3>
              <div className="mt-3">
                <p className="text-xs text-slate-500">Principales</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {exercise.primaryMuscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="bg-pink/55 rounded-full px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      {muscleLabel[muscle]}
                    </span>
                  ))}
                </div>
              </div>
              {exercise.secondaryMuscles.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500">Secundarios</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {exercise.secondaryMuscles.map((muscle) => (
                      <span
                        key={muscle}
                        className="bg-blue/45 rounded-full px-3 py-1.5 text-xs font-bold text-slate-700"
                      >
                        {muscleLabel[muscle]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <aside className="border-purple/35 bg-lavender/20 rounded-2xl border p-5">
            <div className="text-primary flex items-center gap-2">
              <GitCompareArrows size={18} />
              <h2 className="font-bold">Sustituciones aprobadas</h2>
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-600">
              Alternativas que puedes utilizar cuando el equipo, la técnica o el
              contexto lo requieran.
            </p>
            {exercise.substitutes.length ? (
              <div className="mt-4 space-y-2">
                {exercise.substitutes.map((substitute) => (
                  <Link
                    key={substitute.id}
                    href={`/exercises/${substitute.id}`}
                    className="hover:border-primary/30 flex items-center justify-between rounded-xl border border-white bg-white/80 p-3 text-sm font-bold text-slate-800 transition"
                  >
                    <span>{substitute.name}</span>
                    <span className="text-xs font-medium text-slate-500">
                      {equipmentLabel[substitute.equipment]}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border-purple/60 mt-4 rounded-xl border border-dashed bg-white/60 p-4 text-sm text-slate-600">
                No hay alternativas asignadas todavía.
              </div>
            )}
            <div className="border-purple/35 mt-5 border-t pt-4 text-xs leading-5 text-slate-600">
              <span className="text-primary mr-1 inline-flex align-middle">
                <SlidersHorizontal size={14} />
              </span>
              La política y el incremento preparan este ejercicio para su uso
              posterior en rutinas.
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
