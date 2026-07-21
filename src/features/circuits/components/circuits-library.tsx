"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ChevronRight, Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import {
  circuitStatusLabel,
  circuitStatusTone,
} from "@/features/circuits/circuit-labels";
import { circuitApi } from "@/features/circuits/services/circuit-api";
import type { CircuitStatus } from "@/features/circuits/types/circuit";

const filters: Array<{ label: string; value?: CircuitStatus }> = [
  { label: "Todos" },
  { label: "Borradores", value: "DRAFT" },
  { label: "Publicados", value: "PUBLISHED" },
];

export function CircuitsLibrary() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CircuitStatus | undefined>();
  const circuits = useQuery({
    queryKey: ["circuits", query, status],
    queryFn: () =>
      circuitApi.list(
        new URLSearchParams({
          limit: "50",
          ...(query ? { q: query } : {}),
          ...(status ? { status } : {}),
        }),
      ),
  });
  const data = circuits.data;
  return (
    <section className="mx-auto max-w-6xl">
      <div
        data-tour="circuits-overview"
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
            Biblioteca reutilizable
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Circuitos</h1>
          <p className="mt-2 text-sm text-slate-500">
            Diseña secuencias versionadas y asígnalas sin alterar a clientes
            existentes.
          </p>
        </div>
        <Link
          href="/circuits/new"
          className="bg-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} /> Nuevo circuito
        </Link>
      </div>
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center">
        <label className="relative grow">
          <span className="sr-only">Buscar circuitos</span>
          <Search
            className="absolute top-2.5 left-3 text-slate-400"
            size={17}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre"
            className="h-10 w-full rounded-lg border border-slate-200 py-0 pr-3 pl-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-bold",
                status === filter.value
                  ? "bg-primary text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      {circuits.isPending ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-2xl border bg-white"
            />
          ))}
        </div>
      ) : circuits.isError ? (
        <div className="mt-6">
          <EmptyState
            title="No pudimos cargar los circuitos"
            description="Intenta actualizar la página."
          />
        </div>
      ) : data?.items.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((circuit) => (
            <Link
              key={circuit.id}
              href={`/circuits/${circuit.id}`}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(62,43,126,0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="bg-lavender text-primary grid size-10 place-items-center rounded-xl">
                  <Activity size={19} />
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold",
                    circuitStatusTone[circuit.status],
                  )}
                >
                  {circuitStatusLabel[circuit.status]}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-bold tracking-tight">
                {circuit.name}
              </h2>
              <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
                {circuit.description ?? "Sin descripción adicional."}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                <span>
                  v{circuit.latestVersion ?? "—"} · {circuit.exerciseCount}{" "}
                  ejercicios
                </span>
                <span className="text-primary inline-flex items-center gap-1">
                  Ver <ChevronRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Todavía no hay circuitos"
            description="Crea un circuito reutilizable desde esta biblioteca."
          />
          <div className="mt-4 text-center">
            <Link
              href="/circuits/new"
              className="bg-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus size={16} /> Crear circuito
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
