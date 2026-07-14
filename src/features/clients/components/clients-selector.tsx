"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarCheck2,
  ChevronDown,
  Plus,
  Search,
  Trophy,
  UsersRound,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  levelLabel,
  statusLabel,
  statusTone,
} from "@/features/clients/client-labels";
import { clientApi } from "@/features/clients/services/client-api";
import type { Client, ClientStatus } from "@/features/clients/types/client";

const metricCards = [
  {
    key: "active",
    label: "Clientes activos",
    icon: UsersRound,
    tone: "bg-violet-100 text-primary",
  },
  {
    key: "evaluations",
    label: "Evaluaciones registradas",
    icon: CalendarCheck2,
    tone: "bg-pink text-fuchsia-600",
  },
  {
    key: "completed",
    label: "Programas finalizados",
    icon: Trophy,
    tone: "bg-blue text-indigo-600",
  },
] as const;

function initials(client: Client) {
  return `${client.firstName[0]}${client.lastName[0]}`;
}
function ClientCard({ client }: { client: Client }) {
  const weight = client.latestAssessment?.weightKg;
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(32,23,67,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(62,43,126,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="from-pink via-lavender to-blue text-primary grid size-11 place-items-center rounded-full bg-gradient-to-br font-bold ring-2 ring-white">
            {initials(client)}
          </div>
          <div>
            <h2 className="font-bold tracking-tight">{client.fullName}</h2>
            <p className="text-xs text-slate-500">
              {client.primaryGoal ?? "Sin objetivo definido"}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            statusTone[client.status],
          )}
        >
          {statusLabel[client.status]}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-slate-500">Nivel</dt>
        <dd className="font-medium">
          {client.trainingLevel ? levelLabel[client.trainingLevel] : "—"}
        </dd>
        <dt className="text-slate-500">Programa actual</dt>
        <dd className="max-w-38 truncate text-right font-medium">
          {client.currentProgram ?? "Sin asignar"}
        </dd>
        <dt className="text-slate-500">Semana</dt>
        <dd className="font-medium">
          {client.currentWeek ? `${client.currentWeek}` : "—"}
        </dd>
        <dt className="text-slate-500">Última evaluación</dt>
        <dd className="font-medium">
          {client.latestAssessment
            ? new Intl.DateTimeFormat("es", {
                day: "numeric",
                month: "short",
              }).format(new Date(client.latestAssessment.assessedAt))
            : "Pendiente"}
        </dd>
      </dl>
      <div className="to-blue/30 mt-4 grid grid-cols-3 divide-x divide-white rounded-xl bg-gradient-to-r from-violet-50 via-fuchsia-50/70 px-2 py-2.5 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Peso</p>
          <p className="mt-0.5 text-xs font-bold">
            {weight ? `${weight} kg` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">
            <TermTooltip term="IMC" />
          </p>
          <p className="mt-0.5 text-xs font-bold">{client.bmi ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Evaluaciones</p>
          <p className="mt-0.5 text-xs font-bold">{client.assessmentCount}</p>
        </div>
      </div>
      <Link
        href={`/clients/${client.id}`}
        className="border-primary/45 text-primary hover:bg-primary mt-3 flex h-9 items-center justify-center gap-2 rounded-lg border text-xs font-bold transition hover:text-white"
      >
        Ver perfil <ArrowRight size={14} />
      </Link>
    </article>
  );
}

export function ClientsSelector() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ClientStatus>("ALL");
  const params = useMemo(() => {
    const value = new URLSearchParams({ limit: "24" });
    if (search) value.set("q", search);
    if (status !== "ALL") value.set("status", status);
    return value;
  }, [search, status]);
  const { data, isPending, isError } = useQuery({
    queryKey: ["clients", params.toString()],
    queryFn: () => clientApi.list(params),
  });
  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-primary mb-1 text-xs font-bold tracking-[0.18em] uppercase">
            Gestión de clientes
          </p>
          <h1 className="font-display text-4xl font-bold tracking-[-0.055em] text-slate-900">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona tus clientes y accede rápidamente a su progreso.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative w-full sm:w-auto sm:min-w-56">
            <Search
              className="absolute top-3 left-3 text-slate-400"
              size={17}
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="border-slate-200 pl-9 shadow-sm"
              placeholder="Buscar cliente"
              aria-label="Buscar cliente"
            />
          </label>
          <label className="relative">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "ALL" | ClientStatus)
              }
              className="focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-0 pr-10 pl-3 text-sm font-medium shadow-sm outline-none focus:ring-2"
              aria-label="Filtrar por estado"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activo</option>
              <option value="PAUSED">Pausado</option>
              <option value="COMPLETED">Finalizado</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-3 right-3 text-slate-400"
              size={16}
            />
          </label>
          <Link
            href="/clients/new"
            className={cn(
              buttonVariants(),
              "gap-2 shadow-[0_8px_18px_rgba(91,75,183,0.25)]",
            )}
          >
            <Plus size={17} />
            Nuevo cliente
          </Link>
        </div>
      </div>
      {data && (
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {metricCards.map(({ key, label, icon: Icon, tone }) => (
            <div
              key={key}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(32,23,67,0.035)]"
            >
              <div
                className={cn(
                  "grid size-11 place-items-center rounded-xl",
                  tone,
                )}
              >
                <Icon size={21} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="text-2xl font-bold tracking-tight">
                  {data.summary[key]}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6">
        {isPending ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-82 animate-pulse rounded-2xl border bg-white"
              />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="No pudimos cargar los clientes"
            description="Actualiza la página e inténtalo de nuevo."
          />
        ) : data?.items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay clientes para este filtro"
            description="Crea un cliente o cambia los filtros de búsqueda."
          />
        )}
      </div>
    </section>
  );
}
