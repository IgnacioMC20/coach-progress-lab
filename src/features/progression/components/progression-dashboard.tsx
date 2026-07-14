"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ChevronDown,
  Dumbbell,
  TrendingUp,
  TriangleAlert,
  Trophy,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { clientApi } from "@/features/clients/services/client-api";
import { getProgression } from "@/features/progression/services/progression-api";
import type {
  ExerciseProgression,
  ProgressionHistoryPoint,
} from "@/features/progression/types/progression";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
});

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Trophy;
  label: ReactNode;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
      <div className={cn("grid size-9 place-items-center rounded-xl", tone)}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ProgressChart({
  title,
  term,
  history,
  dataKey,
  color,
  suffix,
}: {
  title: string;
  term?: "e1RM";
  history: ProgressionHistoryPoint[];
  dataKey: "e1RmKg" | "volumeKg";
  color: string;
  suffix: string;
}) {
  const data = history.map((point) => ({
    date: dateFormatter.format(new Date(point.date)),
    value: point[dataKey],
  }));
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
      <h2 className="font-bold text-slate-900">
        {term ? <TermTooltip term={term} /> : title}
        {term ? title.replace(term, "") : ""}
      </h2>
      <div
        className="mt-4 h-56"
        role="img"
        aria-label={`Tendencia de ${title}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            title={`Tendencia de ${title}`}
            margin={{ left: -18, right: 6 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#e7e9f0"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              width={42}
            />
            <Tooltip
              formatter={(value) =>
                value === null ? "—" : `${value}${suffix}`
              }
              contentStyle={{
                borderRadius: 12,
                borderColor: "#e2e8f0",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 2, fill: "white" }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ExerciseCard({ exercise }: { exercise: ExerciseProgression }) {
  const suggestionTone =
    exercise.suggestion.type === "INCREASE_LOAD"
      ? "bg-emerald-50 text-emerald-700"
      : exercise.suggestion.type === "BUILD_REPS"
        ? "bg-lavender/45 text-primary"
        : "bg-slate-100 text-slate-600";
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-lavender/50 text-primary grid size-10 place-items-center rounded-xl">
            <Dumbbell size={18} />
          </div>
          <div>
            <h2 className="font-bold tracking-tight text-slate-900">
              {exercise.exerciseName}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {exercise.sessionCount} exposiciones ·{" "}
              {exercise.totalVolumeKg.toFixed(0)} kg
            </p>
          </div>
        </div>
        {exercise.bestE1RmKg !== null && (
          <span className="bg-pink/45 rounded-full px-2.5 py-1 text-[11px] font-bold text-fuchsia-800">
            <TermTooltip term="PR" /> {exercise.bestE1RmKg} kg
          </span>
        )}
      </div>
      <div className="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 px-2 py-3 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Línea base</p>
          <p className="mt-0.5 text-sm font-bold">
            {exercise.baselineE1RmKg ?? "—"} kg
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">
            <TermTooltip term="e1RM" /> actual
          </p>
          <p className="mt-0.5 text-sm font-bold">
            {exercise.currentE1RmKg ?? "—"} kg
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Cambio</p>
          <p
            className={cn(
              "mt-0.5 text-sm font-bold",
              (exercise.e1RmChangePercentage ?? 0) >= 0
                ? "text-emerald-700"
                : "text-rose-600",
            )}
          >
            {exercise.e1RmChangePercentage === null
              ? "—"
              : `${exercise.e1RmChangePercentage > 0 ? "+" : ""}${exercise.e1RmChangePercentage}%`}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "mt-4 rounded-xl px-3 py-2.5 text-xs font-semibold",
          suggestionTone,
        )}
      >
        {exercise.suggestion.message}
      </div>
      {exercise.alerts.length > 0 && (
        <div className="mt-3 space-y-2">
          {exercise.alerts.map((alert) => (
            <p
              key={alert.type}
              className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
            >
              <TriangleAlert size={14} />
              {alert.message}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}

export function ProgressionDashboard() {
  const searchParams = useSearchParams();
  const [clientId, setClientId] = useState(
    () => searchParams.get("clientId") ?? "",
  );
  const [exerciseId, setExerciseId] = useState("");
  const clients = useQuery({
    queryKey: ["progression-clients"],
    queryFn: () =>
      clientApi.list(new URLSearchParams({ limit: "50", status: "ACTIVE" })),
  });
  const progression = useQuery({
    queryKey: ["progression", clientId],
    queryFn: () => getProgression(clientId),
    enabled: Boolean(clientId),
  });
  const selectedExercise =
    progression.data?.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId,
    ) ?? progression.data?.exercises[0];
  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-primary mb-1 text-xs font-bold tracking-[0.18em] uppercase">
            Decisiones de progreso
          </p>
          <h1 className="font-display text-4xl font-bold tracking-[-0.055em] text-slate-900">
            Progresión
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Récords, carga y señales de intervención calculadas desde el
            entrenamiento real.
          </p>
        </div>
        <label className="relative">
          <span className="sr-only">Seleccionar cliente</span>
          <select
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value);
              setExerciseId("");
            }}
            className="focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-0 pr-10 pl-3 text-sm font-medium shadow-sm outline-none sm:min-w-64 sm:w-auto focus:ring-2"
          >
            <option value="">Seleccionar cliente</option>
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
      </div>

      {!clientId ? (
        <div className="border-lavender/70 bg-lavender/15 mt-8 flex items-center gap-3 rounded-2xl border p-5 text-sm text-slate-600">
          <TrendingUp className="text-primary" size={22} />
          Selecciona un cliente con sesiones completadas para calcular su
          progresión.
        </div>
      ) : progression.isPending ? (
        <div className="mt-8 h-120 animate-pulse rounded-2xl border bg-white" />
      ) : progression.isError || !progression.data ? (
        <EmptyState
          title="No pudimos calcular la progresión"
          description="Actualiza la página e inténtalo de nuevo."
        />
      ) : progression.data.exercises.length === 0 ? (
        <EmptyState
          title="Aún no hay datos de progreso"
          description="Registra sesiones completadas con carga y repeticiones para activar los cálculos."
        />
      ) : (
        <>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              icon={Trophy}
              label="Récords personales"
              value={String(progression.data.summary.personalRecords)}
              tone="bg-pink/45 text-fuchsia-800"
            />
            <Metric
              icon={Activity}
              label="Volumen acumulado"
              value={`${progression.data.summary.totalVolumeKg.toFixed(0)} kg`}
              tone="bg-blue/35 text-primary"
            />
            <Metric
              icon={TrendingUp}
              label={
                <span className="inline-flex items-center gap-1">
                  Cambio <TermTooltip term="e1RM" /> promedio
                </span>
              }
              value={
                progression.data.summary.averageE1RmChangePercentage === null
                  ? "Sin línea base"
                  : `${progression.data.summary.averageE1RmChangePercentage > 0 ? "+" : ""}${progression.data.summary.averageE1RmChangePercentage}%`
              }
              tone="bg-emerald-50 text-emerald-700"
            />
            <Metric
              icon={TriangleAlert}
              label="Alertas activas"
              value={String(progression.data.summary.alerts)}
              tone="bg-amber-50 text-amber-700"
            />
          </div>

          {selectedExercise && (
            <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Tendencia por ejercicio
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    <TermTooltip term="e1RM" /> estimado con Epley y volumen
                    realizado por sesión.
                  </p>
                </div>
                <select
                  value={selectedExercise.exerciseId}
                  onChange={(event) => setExerciseId(event.target.value)}
                  className="focus:ring-primary/20 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none sm:min-w-56 sm:w-auto focus:ring-2"
                >
                  {progression.data.exercises.map((exercise) => (
                    <option
                      key={exercise.exerciseId}
                      value={exercise.exerciseId}
                    >
                      {exercise.exerciseName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <ProgressChart
                  title="e1RM estimado"
                  term="e1RM"
                  history={selectedExercise.history}
                  dataKey="e1RmKg"
                  color="#5B4BB7"
                  suffix=" kg"
                />
                <ProgressChart
                  title="Volumen por sesión"
                  history={selectedExercise.history}
                  dataKey="volumeKg"
                  color="#6478e8"
                  suffix=" kg"
                />
              </div>
            </section>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-bold tracking-tight">
              Acciones por ejercicio
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Revisa las sugerencias antes de modificar la programación.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {progression.data.exercises.map((exercise) => (
                <ExerciseCard key={exercise.exerciseId} exercise={exercise} />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
