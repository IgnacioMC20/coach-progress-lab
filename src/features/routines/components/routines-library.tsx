"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Layers3,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  routineStatusLabel,
  routineStatusTone,
} from "@/features/routines/routine-labels";
import { routineApi } from "@/features/routines/services/routine-api";
import type { Routine, RoutineStatus } from "@/features/routines/types/routine";
import { cn } from "@/lib/utils";

const metricCards = [
  {
    key: "total",
    label: "Plantillas",
    icon: ClipboardList,
    tone: "bg-lavender text-primary",
  },
  {
    key: "published",
    label: "Publicadas",
    icon: Layers3,
    tone: "bg-blue text-indigo-600",
  },
  {
    key: "draft",
    label: "Borradores",
    icon: CalendarDays,
    tone: "bg-pink text-fuchsia-600",
  },
  {
    key: "assignments",
    label: "Asignaciones activas",
    icon: UsersRound,
    tone: "bg-violet-100 text-primary",
  },
] as const;

function RoutineCard({ routine }: { routine: Routine }) {
  return (
    <article className="group flex min-h-57 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(62,43,126,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="bg-lavender/45 text-primary grid size-11 place-items-center rounded-xl">
          <ClipboardList size={20} />
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            routineStatusTone[routine.status],
          )}
        >
          {routineStatusLabel[routine.status]}
        </span>
      </div>
      <div className="mt-4">
        <h2 className="font-bold tracking-tight text-slate-900">{routine.name}</h2>
        <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
          {routine.description ?? "Sin descripción todavía."}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 px-2 py-3 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Versión</p>
          <p className="mt-0.5 text-sm font-bold">v{routine.latestVersion ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Días</p>
          <p className="mt-0.5 text-sm font-bold">{routine.dayCount}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Clientes</p>
          <p className="mt-0.5 text-sm font-bold">{routine.assignmentCount}</p>
        </div>
      </div>
      <Link
        href={`/routines/${routine.id}`}
        className="border-primary/45 text-primary hover:bg-primary mt-4 flex h-9 items-center justify-center gap-2 rounded-lg border text-xs font-bold transition hover:text-white"
      >
        Abrir constructor <ArrowRight size={14} />
      </Link>
    </article>
  );
}

export function RoutinesLibrary() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | RoutineStatus>("ALL");
  const params = useMemo(() => {
    const value = new URLSearchParams({ limit: "24" });
    if (search) value.set("q", search);
    if (status !== "ALL") value.set("status", status);
    return value;
  }, [search, status]);
  const { data, isPending, isError } = useQuery({
    queryKey: ["routines", params.toString()],
    queryFn: () => routineApi.list(params),
  });
  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-primary mb-1 text-xs font-bold tracking-[0.18em] uppercase">
            Programación
          </p>
          <h1 className="font-display text-4xl font-bold tracking-[-0.055em] text-slate-900">
            Rutinas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Crea plantillas versionadas y asigna una versión concreta a cada cliente.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-56">
            <Search className="absolute top-3 left-3 text-slate-400" size={17} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="border-slate-200 pl-9 shadow-sm"
              placeholder="Buscar rutina"
              aria-label="Buscar rutina"
            />
          </label>
          <label className="relative">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "ALL" | RoutineStatus)}
              className="focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-0 pr-10 pl-3 text-sm font-medium shadow-sm outline-none focus:ring-2"
              aria-label="Filtrar por estado"
            >
              <option value="ALL">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicada</option>
              <option value="ARCHIVED">Archivada</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-3 right-3 text-slate-400"
              size={16}
            />
          </label>
          <Link
            href="/routines/new"
            className={cn(
              buttonVariants(),
              "gap-2 shadow-[0_8px_18px_rgba(91,75,183,0.25)]",
            )}
          >
            <Plus size={17} />
            Nueva rutina
          </Link>
        </div>
      </div>
      {data && (
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map(({ key, label, icon: Icon, tone }) => (
            <div
              key={key}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(32,23,67,0.035)]"
            >
              <div className={cn("grid size-11 place-items-center rounded-xl", tone)}>
                <Icon size={21} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="text-2xl font-bold tracking-tight">{data.summary[key]}</p>
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
                className="h-57 animate-pulse rounded-2xl border bg-white"
              />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="No pudimos cargar las rutinas"
            description="Actualiza la página e inténtalo de nuevo."
          />
        ) : data?.items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((routine) => (
              <RoutineCard key={routine.id} routine={routine} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay rutinas para este filtro"
            description="Crea una plantilla o cambia los filtros de búsqueda."
          />
        )}
      </div>
    </section>
  );
}
