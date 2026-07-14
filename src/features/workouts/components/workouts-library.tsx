"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Plus,
  Scale,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { clientApi } from "@/features/clients/services/client-api";
import {
  workoutStatusLabel,
  workoutStatusTone,
} from "@/features/workouts/workout-labels";
import { workoutApi } from "@/features/workouts/services/workout-api";
import type { WorkoutSession } from "@/features/workouts/types/workout";
import { cn } from "@/lib/utils";

function monday(date = new Date()) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}
function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
function sessionVolume(session: WorkoutSession) {
  return session.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce(
        (setsTotal, set) => setsTotal + (set.weightKg ?? 0) * (set.reps ?? 0),
        0,
      ),
    0,
  );
}

function WorkoutCard({ session }: { session: WorkoutSession }) {
  const sets = session.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-lavender/50 text-primary grid size-10 place-items-center rounded-xl">
            <Dumbbell size={18} />
          </div>
          <div>
            <p className="font-bold tracking-tight">{session.clientName}</p>
            <p className="text-xs text-slate-500">
              {new Intl.DateTimeFormat("es", {
                weekday: "short",
                day: "numeric",
                month: "short",
              }).format(new Date(session.performedAt))}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            workoutStatusTone[session.status],
          )}
        >
          {workoutStatusLabel[session.status]}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 px-2 py-2.5 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Ejercicios</p>
          <p className="mt-0.5 text-sm font-bold">{session.exercises.length}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Series</p>
          <p className="mt-0.5 text-sm font-bold">{sets}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Volumen</p>
          <p className="mt-0.5 text-sm font-bold">
            {sessionVolume(session).toFixed(0)} kg
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {session.exercises.slice(0, 3).map((exercise) => (
          <span
            key={exercise.id}
            className="bg-blue/35 rounded-md px-2 py-1 text-[10px] font-semibold text-slate-700"
          >
            {exercise.exerciseName}
          </span>
        ))}
      </div>
      <Link
        href={`/workouts/${session.id}`}
        className="border-primary/45 text-primary hover:bg-primary mt-4 flex h-9 items-center justify-center gap-2 rounded-lg border text-xs font-bold transition hover:text-white"
      >
        Ver sesión <ArrowRight size={14} />
      </Link>
    </article>
  );
}

export function WorkoutsLibrary() {
  const [clientId, setClientId] = useState("");
  const [weekStart, setWeekStart] = useState(() => monday());
  const clients = useQuery({
    queryKey: ["workout-clients"],
    queryFn: () => clientApi.list(new URLSearchParams({ limit: "50", status: "ACTIVE" })),
  });
  const params = useMemo(() => {
    const value = new URLSearchParams({ limit: "50", weekStart: dateValue(weekStart) });
    if (clientId) value.set("clientId", clientId);
    return value;
  }, [clientId, weekStart]);
  const workouts = useQuery({
    queryKey: ["workouts", params.toString()],
    queryFn: () => workoutApi.list(params),
  });
  const label = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(
    weekStart,
  );
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-primary mb-1 text-xs font-bold tracking-[0.18em] uppercase">
            Registro de ejecución
          </p>
          <h1 className="font-display text-4xl font-bold tracking-[-0.055em] text-slate-900">
            Entrenamientos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Registra cada serie y revisa la ejecución real de la semana.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <select
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="focus:ring-primary/20 h-10 min-w-56 appearance-none rounded-lg border border-slate-200 bg-white py-0 pr-10 pl-3 text-sm font-medium shadow-sm outline-none focus:ring-2"
            >
              <option value="">Todos los clientes</option>
              {clients.data?.items.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.fullName}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-3 right-3 text-slate-400"
              size={16}
            />
          </label>
          <Link
            href={clientId ? `/workouts/new?clientId=${clientId}` : "/workouts/new"}
            className={cn(
              buttonVariants(),
              "gap-2 shadow-[0_8px_18px_rgba(91,75,183,0.25)]",
            )}
          >
            <Plus size={17} />
            Nueva sesión
          </Link>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setWeekStart((current) => {
                const next = new Date(current);
                next.setDate(next.getDate() - 7);
                return next;
              })
            }
            className="hover:bg-lavender/40 rounded-lg p-2 text-slate-500"
            aria-label="Semana anterior"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-40 text-center">
            <p className="text-xs font-semibold text-slate-500">Historial semanal</p>
            <p className="text-sm font-bold">
              {label} —{" "}
              {new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(
                end,
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setWeekStart((current) => {
                const next = new Date(current);
                next.setDate(next.getDate() + 7);
                return next;
              })
            }
            className="hover:bg-lavender/40 rounded-lg p-2 text-slate-500"
            aria-label="Semana siguiente"
          >
            <ArrowRight size={17} />
          </button>
        </div>
        {workouts.data && (
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <CalendarDays size={16} className="text-primary" />
              {workouts.data.summary.sessions} sesiones
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <CheckCircle2 size={16} className="text-emerald-600" />
              {workouts.data.summary.completed} completadas
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <Scale size={16} className="text-primary" />
              {workouts.data.summary.volumeKg.toFixed(0)} kg
            </span>
          </div>
        )}
      </div>
      <div className="mt-6">
        {workouts.isPending ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-61 animate-pulse rounded-2xl border bg-white"
              />
            ))}
          </div>
        ) : workouts.isError ? (
          <EmptyState
            title="No pudimos cargar los entrenamientos"
            description="Actualiza la página e inténtalo de nuevo."
          />
        ) : workouts.data?.items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workouts.data.items.map((session) => (
              <WorkoutCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay sesiones esta semana"
            description="Registra una nueva sesión o cambia el periodo seleccionado."
          />
        )}
      </div>
    </section>
  );
}
