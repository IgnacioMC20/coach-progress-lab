"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  Dumbbell,
  Gauge,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { getDashboard } from "@/features/dashboard/services/dashboard-api";
import type { DashboardAttentionType } from "@/features/dashboard/types/dashboard";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
});
const fullDateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
});

const attentionTone: Record<DashboardAttentionType, string> = {
  PAIN: "bg-rose-50 text-rose-700",
  STAGNATION: "bg-amber-50 text-amber-800",
  NO_WORKOUT: "bg-violet-50 text-primary",
  NO_CHECK_IN: "bg-blue/35 text-slate-700",
};

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
      <div className={cn("grid size-9 place-items-center rounded-xl", tone)}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </article>
  );
}

export function ProgressDashboard() {
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  if (dashboard.isPending)
    return (
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border bg-white"
          />
        ))}
      </div>
    );
  if (dashboard.isError || !dashboard.data)
    return (
      <EmptyState
        title="No pudimos cargar el panorama"
        description="Actualiza la página e inténtalo nuevamente."
      />
    );
  const data = dashboard.data;
  if (!data.summary.activeClients)
    return (
      <EmptyState
        title="Aún no hay clientes activos"
        description="Crea o reactiva un cliente para empezar a seguir su progreso."
      />
    );

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary mb-1 text-xs font-bold tracking-[0.18em] uppercase">
            Cartera de coaching
          </p>
          <h1 className="font-display text-4xl font-bold tracking-[-0.055em] text-slate-900">
            Panorama de progreso
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Señales para decidir dónde intervenir primero.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-primary">
          <CalendarClock size={14} /> Últimos 7 días
        </span>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Users}
          label="Clientes activos"
          value={String(data.summary.activeClients)}
          tone="bg-lavender/45 text-primary"
        />
        <Metric
          icon={Dumbbell}
          label="Sesiones completadas"
          value={String(data.summary.completedWorkouts)}
          tone="bg-blue/35 text-primary"
        />
        <Metric
          icon={Gauge}
          label="Volumen registrado"
          value={`${data.summary.volumeKg.toFixed(0)} kg`}
          tone="bg-emerald-50 text-emerald-700"
        />
        <Metric
          icon={TriangleAlert}
          label="Requieren seguimiento"
          value={String(data.summary.attentionClients)}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <TriangleAlert className="text-amber-600" size={18} /> Clientes
                que requieren atención
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Alertas de progreso, actividad y seguimiento semanal.
              </p>
            </div>
            <Link
              href="/clients"
              className="text-primary text-xs font-bold hover:underline"
            >
              Ver clientes
            </Link>
          </div>
          {data.attention.length ? (
            <div className="mt-5 divide-y divide-slate-100">
              {data.attention.map((client) => (
                <article
                  key={client.clientId}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-900">
                        {client.clientName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {client.primaryGoal ?? "Objetivo pendiente"} · última
                        sesión{" "}
                        {client.lastWorkoutAt
                          ? fullDateFormatter.format(
                              new Date(client.lastWorkoutAt),
                            )
                          : "sin registro"}
                      </p>
                    </div>
                    <Link
                      href={`/clients/${client.clientId}`}
                      className="text-primary inline-flex items-center gap-1 text-xs font-bold hover:underline"
                    >
                      Ver perfil <ArrowRight size={13} />
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {client.reasons.map((reason) => (
                      <span
                        key={reason.type}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          attentionTone[reason.type],
                        )}
                      >
                        {reason.message}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              No hay señales de seguimiento pendientes en esta cartera.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <TrendingUp className="text-primary" size={18} /> Avances destacados
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Mejor cambio promedio de{" "}
            <TermTooltip term="e1RM" className="font-semibold" />.
          </p>
          {data.topProgress.length ? (
            <ol className="mt-5 space-y-3">
              {data.topProgress.map((client, index) => (
                <li
                  key={client.clientId}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3"
                >
                  <span className="text-primary grid size-7 shrink-0 place-items-center rounded-lg bg-lavender/50 text-xs font-black">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {client.clientName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {client.personalRecords}{" "}
                      <TermTooltip term="PR" className="font-semibold" />
                    </p>
                  </div>
                  <Link
                    href={`/progression?clientId=${client.clientId}`}
                    className="text-right text-sm font-black text-emerald-700 hover:underline"
                  >
                    +{client.averageE1RmChangePercentage}%
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Registra carga y repeticiones para empezar a comparar avances.
            </p>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Activity className="text-primary" size={18} /> Actividad reciente
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sesiones y check-ins de la última semana.
          </p>
        </div>
        {data.recentActivity.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.recentActivity.map((item) => {
              const Icon = item.type === "WORKOUT" ? Dumbbell : ClipboardCheck;
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="group rounded-xl border border-slate-100 p-3 transition hover:border-primary/25 hover:bg-violet-50/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-primary grid size-9 shrink-0 place-items-center rounded-lg bg-lavender/40">
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-primary">
                        {item.clientName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.detail}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold text-slate-400">
                        {dateFormatter.format(new Date(item.occurredAt))}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            No hay actividad registrada durante este periodo.
          </p>
        )}
      </section>
    </section>
  );
}
