"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronDown,
  Dumbbell,
  GitCompareArrows,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  equipmentLabel,
  measurementTypeLabel,
  movementPatternLabel,
  muscleLabel,
} from "@/features/exercises/exercise-labels";
import { exerciseApi } from "@/features/exercises/services/exercise-api";
import type {
  EquipmentType,
  Exercise,
  MovementPattern,
} from "@/features/exercises/types/exercise";
import { cn } from "@/lib/utils";

const metricCards = [
  {
    key: "total",
    label: "Ejercicios activos",
    icon: Dumbbell,
    tone: "bg-violet-100 text-primary",
  },
  {
    key: "weighted",
    label: "Con carga externa",
    icon: SlidersHorizontal,
    tone: "bg-blue text-indigo-600",
  },
  {
    key: "bodyweight",
    label: "Peso corporal",
    icon: Dumbbell,
    tone: "bg-pink text-fuchsia-600",
  },
  {
    key: "withSubstitutions",
    label: "Con sustituciones",
    icon: GitCompareArrows,
    tone: "bg-lavender text-primary",
  },
] as const;

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <article className="group flex min-h-68 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(62,43,126,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="bg-lavender/45 text-primary grid size-11 shrink-0 place-items-center rounded-xl">
          <Dumbbell size={20} />
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {equipmentLabel[exercise.equipment]}
        </span>
      </div>
      <div className="mt-4">
        <h2 className="font-bold tracking-tight text-slate-900">
          {exercise.name}
        </h2>
        <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
          {exercise.description ?? "Sin descripción todavía."}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {exercise.primaryMuscles.slice(0, 3).map((muscle) => (
          <span
            key={muscle}
            className="bg-pink/50 rounded-md px-2 py-1 text-[10px] font-bold text-slate-700"
          >
            {muscleLabel[muscle]}
          </span>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs">
        <div>
          <dt className="text-slate-500">Patrón</dt>
          <dd className="mt-0.5 font-semibold text-slate-800">
            {movementPatternLabel[exercise.movementPattern]}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Progresión</dt>
          <dd className="mt-0.5 font-semibold text-slate-800">
            {exercise.minimumIncrement
              ? `+${exercise.minimumIncrement} kg`
              : measurementTypeLabel[exercise.measurementType]}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {exercise.substitutes.length
            ? `${exercise.substitutes.length} sustitución${exercise.substitutes.length > 1 ? "es" : ""}`
            : "Sin sustituciones"}
        </span>
        <Link
          href={`/exercises/${exercise.id}`}
          className="text-primary inline-flex items-center gap-1 font-bold hover:underline"
        >
          Ver ficha <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

export function ExercisesLibrary() {
  const [search, setSearch] = useState("");
  const [equipment, setEquipment] = useState<"ALL" | EquipmentType>("ALL");
  const [pattern, setPattern] = useState<"ALL" | MovementPattern>("ALL");
  const params = useMemo(() => {
    const value = new URLSearchParams({ limit: "24" });
    if (search) value.set("q", search);
    if (equipment !== "ALL") value.set("equipment", equipment);
    if (pattern !== "ALL") value.set("movementPattern", pattern);
    return value;
  }, [equipment, pattern, search]);
  const { data, isPending, isError } = useQuery({
    queryKey: ["exercises", params.toString()],
    queryFn: () => exerciseApi.list(params),
  });

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-primary mb-1 text-xs font-bold tracking-[0.18em] uppercase">
            Biblioteca de entrenamiento
          </p>
          <h1 className="font-display text-4xl font-bold tracking-[-0.055em] text-slate-900">
            Ejercicios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define cómo se mide, progresa y sustituye cada movimiento.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <label className="relative w-full sm:w-auto sm:min-w-56">
            <Search
              className="absolute top-3 left-3 text-slate-400"
              size={17}
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="border-slate-200 pl-9 shadow-sm"
              placeholder="Buscar ejercicio"
              aria-label="Buscar ejercicio"
            />
          </label>
          <label className="relative">
            <select
              value={equipment}
              onChange={(event) =>
                setEquipment(event.target.value as "ALL" | EquipmentType)
              }
              className="focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-0 pr-10 pl-3 text-sm font-medium shadow-sm outline-none focus:ring-2"
              aria-label="Filtrar por equipo"
            >
              <option value="ALL">Todo equipo</option>
              {Object.entries(equipmentLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-3 right-3 text-slate-400"
              size={16}
            />
          </label>
          <label className="relative">
            <select
              value={pattern}
              onChange={(event) =>
                setPattern(event.target.value as "ALL" | MovementPattern)
              }
              className="focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-0 pr-10 pl-3 text-sm font-medium shadow-sm outline-none focus:ring-2"
              aria-label="Filtrar por patrón"
            >
              <option value="ALL">Todo patrón</option>
              {Object.entries(movementPatternLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-3 right-3 text-slate-400"
              size={16}
            />
          </label>
          <Link
            href="/exercises/new"
            className={cn(
              buttonVariants(),
              "gap-2 shadow-[0_8px_18px_rgba(91,75,183,0.25)]",
            )}
          >
            <Plus size={17} /> Nuevo ejercicio
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
                className="h-68 animate-pulse rounded-2xl border bg-white"
              />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="No pudimos cargar los ejercicios"
            description="Actualiza la página e inténtalo de nuevo."
          />
        ) : data?.items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay ejercicios para este filtro"
            description="Crea un ejercicio o cambia los filtros de búsqueda."
          />
        )}
      </div>
    </section>
  );
}
