"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Dumbbell, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  techniqueLabel,
  workoutStatusLabel,
  workoutStatusTone,
} from "@/features/workouts/workout-labels";
import { workoutApi } from "@/features/workouts/services/workout-api";
import { cn } from "@/lib/utils";

function value(value: number | null, suffix: string) {
  return value === null ? "—" : `${value}${suffix}`;
}

export function WorkoutProfile() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: () => workoutApi.get(workoutId),
    enabled: Boolean(workoutId),
  });
  const remove = useMutation({
    mutationFn: () => workoutApi.remove(workoutId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workouts"] });
      router.push("/workouts");
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
        title="No encontramos esta sesión"
        description="Puede haberse eliminado o la dirección no es válida."
      />
    );
  const workout = query.data;
  const confirmDelete = () => {
    if (window.confirm(`¿Eliminar la sesión de ${workout.clientName}?`)) remove.mutate();
  };
  return (
    <section className="mx-auto max-w-5xl">
      <Link
        href="/workouts"
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} />
        Volver a entrenamientos
      </Link>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
        <div className="from-lavender/50 to-blue/30 border-b border-slate-100 bg-gradient-to-r via-white px-6 py-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row">
            <div className="flex gap-4">
              <div className="bg-primary shadow-primary/20 grid size-13 shrink-0 place-items-center rounded-2xl text-white shadow-lg">
                <Dumbbell size={24} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                    Sesión registrada
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      workoutStatusTone[workout.status],
                    )}
                  >
                    {workoutStatusLabel[workout.status]}
                  </span>
                </div>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  {workout.clientName}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {new Intl.DateTimeFormat("es", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(workout.performedAt))}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/workouts/${workout.id}/edit`}
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
                aria-label="Eliminar sesión"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
          {workout.notes && (
            <p className="border-blue/45 bg-blue/20 mt-5 rounded-xl border p-3 text-sm text-slate-700">
              {workout.notes}
            </p>
          )}
        </div>
        <div className="space-y-5 p-6">
          {workout.exercises.map((exercise) => (
            <article
              key={exercise.id}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/45 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
                    Ejercicio {exercise.position}
                  </p>
                  <h2 className="mt-1 text-lg font-bold">{exercise.exerciseName}</h2>
                  <p className="text-xs text-slate-500">
                    {exercise.equipment ?? "Ejercicio eliminado"}
                  </p>
                </div>
                <span className="bg-lavender/45 text-primary rounded-lg px-3 py-2 text-sm font-bold">
                  {exercise.sets.length} series
                </span>
              </div>
              {exercise.notes && (
                <p className="mt-3 text-sm text-slate-600">{exercise.notes}</p>
              )}
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="pr-4 pb-2">Serie</th>
                      <th className="pr-4 pb-2">Carga</th>
                      <th className="pr-4 pb-2">Reps</th>
                      <th className="pr-4 pb-2">Tiempo</th>
                      <th className="pr-4 pb-2">RIR</th>
                      <th className="pr-4 pb-2">Técnica</th>
                      <th className="pr-4 pb-2">Dolor</th>
                      <th className="pb-2">Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercise.sets.map((set) => (
                      <tr
                        key={set.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-3 pr-4 font-bold">{set.position}</td>
                        <td className="py-3 pr-4">{value(set.weightKg, " kg")}</td>
                        <td className="py-3 pr-4">{value(set.reps, "")}</td>
                        <td className="py-3 pr-4">{value(set.durationSeconds, " s")}</td>
                        <td className="py-3 pr-4">{value(set.rir, "")}</td>
                        <td className="py-3 pr-4">
                          {set.technique ? techniqueLabel[set.technique] : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          {set.painLevel === null ? "—" : `${set.painLevel}/10`}
                        </td>
                        <td className="py-3 text-slate-600">{set.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
