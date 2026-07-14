"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  CopyPlus,
  Dumbbell,
  Layers3,
  Pause,
  PlayCircle,
  Trash2,
  UserPlus,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { clientApi } from "@/features/clients/services/client-api";
import {
  assignmentStatusLabel,
  blockTypeLabel,
  routineStatusLabel,
  routineStatusTone,
} from "@/features/routines/routine-labels";
import { routineApi } from "@/features/routines/services/routine-api";
import type { RoutineAssignmentStatus } from "@/features/routines/types/routine";
import { cn } from "@/lib/utils";

function prescription(exercise: {
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
  restSeconds: number | null;
}) {
  const reps = exercise.repsMin
    ? `${exercise.repsMin}${exercise.repsMax && exercise.repsMax !== exercise.repsMin ? `–${exercise.repsMax}` : ""} reps`
    : "Sin reps";
  return `${exercise.sets} × ${reps}${exercise.rir !== null ? ` · RIR ${exercise.rir}` : ""}${exercise.restSeconds ? ` · ${exercise.restSeconds}s` : ""}`;
}

export function RoutineProfile() {
  const { routineId } = useParams<{ routineId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [versionId, setVersionId] = useState("");
  const routine = useQuery({
    queryKey: ["routine", routineId],
    queryFn: () => routineApi.get(routineId),
    enabled: Boolean(routineId),
  });
  const clients = useQuery({
    queryKey: ["assignment-clients"],
    queryFn: () => clientApi.list(new URLSearchParams({ limit: "50", status: "ACTIVE" })),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["routine", routineId] });
    void queryClient.invalidateQueries({ queryKey: ["routines"] });
  };
  const assign = useMutation({
    mutationFn: () =>
      routineApi.assign(routineId, {
        clientId,
        routineVersionId: versionId || routine.data?.currentVersion?.id,
      }),
    onSuccess: () => {
      setClientId("");
      refresh();
    },
    onError: (error) => window.alert(error.message),
  });
  const updateAssignment = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoutineAssignmentStatus }) =>
      routineApi.updateAssignment(id, { status }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => routineApi.remove(routineId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["routines"] });
      router.push("/routines");
      router.refresh();
    },
  });
  if (routine.isPending)
    return (
      <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-2xl border bg-white" />
    );
  if (routine.isError || !routine.data)
    return (
      <EmptyState
        title="No encontramos esta rutina"
        description="Puede haberse eliminado o la dirección no es válida."
      />
    );
  const data = routine.data;
  const current = data.currentVersion;
  const confirmDelete = () => {
    if (window.confirm(`¿Eliminar “${data.name}” y todas sus versiones?`))
      remove.mutate();
  };
  return (
    <section className="mx-auto max-w-6xl">
      <Link
        href="/routines"
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} />
        Volver a rutinas
      </Link>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
        <div className="from-lavender/50 to-blue/30 border-b border-slate-100 bg-gradient-to-r via-white px-6 py-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row">
            <div className="flex gap-4">
              <div className="bg-primary shadow-primary/20 grid size-13 shrink-0 place-items-center rounded-2xl text-white shadow-lg">
                <ClipboardListIcon />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                    Plantilla versionada
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      routineStatusTone[data.status],
                    )}
                  >
                    {routineStatusLabel[data.status]}
                  </span>
                </div>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  {data.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {data.description ?? "Sin descripción adicional."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/routines/${data.id}/new-version`}
                className="border-primary/35 text-primary hover:bg-lavender/30 inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-bold"
              >
                <CopyPlus size={16} />
                Nueva versión
              </Link>
              <Button
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={confirmDelete}
                disabled={remove.isPending}
                aria-label="Eliminar rutina"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-6 p-6 xl:grid-cols-[1.45fr_0.8fr]">
          {current ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
                    Versión actual
                  </p>
                  <h2 className="mt-1 text-xl font-bold">v{current.version}</h2>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  {current.days.length} días
                </div>
              </div>
              {current.notes && (
                <p className="border-blue/45 bg-blue/25 mb-4 rounded-xl border p-3 text-sm text-slate-700">
                  {current.notes}
                </p>
              )}
              <div className="space-y-4">
                {current.days.map((day) => (
                  <article
                    key={day.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/45 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-primary grid size-8 place-items-center rounded-lg text-xs font-bold text-white">
                        {day.position}
                      </span>
                      <h3 className="font-bold">{day.name}</h3>
                    </div>
                    <div className="mt-4 space-y-3">
                      {day.blocks.map((block) => (
                        <div
                          key={block.id}
                          className="border-purple/35 rounded-xl border bg-white p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-primary text-xs font-bold">
                              {blockTypeLabel[block.type]}
                              {block.name ? ` · ${block.name}` : ""}
                            </p>
                            {block.restSeconds && (
                              <span className="text-[11px] font-semibold text-slate-500">
                                Descanso {block.restSeconds}s
                              </span>
                            )}
                          </div>
                          <div className="mt-2 divide-y divide-slate-100">
                            {block.exercises.map((exercise) => (
                              <div
                                key={exercise.id}
                                className="flex items-center justify-between gap-4 py-2.5"
                              >
                                <div>
                                  <p className="text-sm font-bold text-slate-800">
                                    {exercise.exerciseName}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {exercise.equipment ?? "Ejercicio eliminado"}
                                  </p>
                                </div>
                                <p className="text-right text-xs font-semibold text-slate-600">
                                  {prescription(exercise)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Esta plantilla aún no tiene versiones"
              description="Crea una versión para comenzar a programar."
            />
          )}
          <aside className="space-y-5">
            <div className="border-purple/35 bg-lavender/20 rounded-2xl border p-5">
              <div className="text-primary flex items-center gap-2">
                <UserPlus size={18} />
                <h2 className="font-bold">Asignar a cliente</h2>
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-600">
                La asignación conserva exactamente la versión elegida.
              </p>
              <div className="mt-4 space-y-3">
                <select
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  className="focus:ring-primary/20 border-purple/45 h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2"
                >
                  <option value="">Seleccionar cliente activo</option>
                  {clients.data?.items.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName}
                    </option>
                  ))}
                </select>
                <label className="relative block">
                  <select
                    value={versionId || current?.id || ""}
                    onChange={(event) => setVersionId(event.target.value)}
                    className="focus:ring-primary/20 border-purple/45 h-10 w-full appearance-none rounded-lg border bg-white py-0 pr-10 pl-3 text-sm outline-none focus:ring-2"
                  >
                    {data.versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        Versión {version.version}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute top-3 right-3 text-slate-400"
                    size={16}
                  />
                </label>
                <Button
                  type="button"
                  onClick={() => assign.mutate()}
                  disabled={!clientId || !current || assign.isPending}
                  className="w-full"
                >
                  <UserPlus size={16} />
                  {assign.isPending ? "Asignando…" : "Asignar rutina"}
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-primary" size={18} />
                <h2 className="font-bold">Asignaciones</h2>
              </div>
              {data.assignments.length ? (
                <div className="mt-4 space-y-3">
                  {data.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold">{assignment.clientName}</p>
                          <p className="text-xs text-slate-500">
                            v{assignment.version} ·{" "}
                            {assignmentStatusLabel[assignment.status]}
                          </p>
                        </div>
                        {assignment.status === "ACTIVE" && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateAssignment.mutate({
                                  id: assignment.id,
                                  status: "PAUSED",
                                })
                              }
                              className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
                              aria-label="Pausar asignación"
                            >
                              <Pause size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateAssignment.mutate({
                                  id: assignment.id,
                                  status: "COMPLETED",
                                })
                              }
                              className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                              aria-label="Finalizar asignación"
                            >
                              <PlayCircle size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Todavía no hay clientes asignados.
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-center gap-2">
                <Layers3 className="text-primary" size={18} />
                <h2 className="font-bold">Historial</h2>
              </div>
              <div className="mt-4 space-y-2">
                {data.versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold">Versión {version.version}</span>
                    <span className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat("es", {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(version.createdAt))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ClipboardListIcon() {
  return <Dumbbell size={24} />;
}
