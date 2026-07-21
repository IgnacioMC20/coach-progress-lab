"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Resolver, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { exerciseApi } from "@/features/exercises/services/exercise-api";
import {
  blockTypeLabel,
  routineStatusLabel,
} from "@/features/routines/routine-labels";
import { routineApi } from "@/features/routines/services/routine-api";
import {
  routineInputSchema,
  routineVersionInputSchema,
} from "@/features/routines/schemas/routine.schema";
import type {
  RoutineBlockType,
  RoutineDetail,
  RoutineStatus,
} from "@/features/routines/types/routine";

type Entry = {
  exerciseId: string;
  sets: number;
  repsMin?: number;
  repsMax?: number;
  rir?: number;
  restSeconds?: number;
  notes?: string;
};
type Block = {
  name?: string;
  type: RoutineBlockType;
  restSeconds?: number;
  exercises: Entry[];
};
type Day = { name: string; blocks: Block[] };
type HeaderValues = {
  name: string;
  description?: string;
  status: RoutineStatus;
  notes?: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15";
const newEntry = (): Entry => ({
  exerciseId: "",
  sets: 3,
  repsMin: 8,
  repsMax: 12,
  rir: 2,
  restSeconds: 90,
});
const newBlock = (): Block => ({
  type: "STRAIGHT_SET",
  exercises: [newEntry()],
});
const newDay = (position: number): Day => ({
  name: `Día ${position}`,
  blocks: [newBlock()],
});
const routineHeaderSchema = routineInputSchema
  .pick({ name: true, description: true, status: true })
  .extend({ notes: routineVersionInputSchema.shape.notes });

function fromRoutine(routine?: RoutineDetail): Day[] {
  const version = routine?.currentVersion;
  if (!version) return [newDay(1)];
  return version.days.map((day) => ({
    name: day.name,
    blocks: day.blocks.map((block) => ({
      name: block.name ?? "",
      type: block.type,
      restSeconds: block.restSeconds ?? undefined,
      exercises: block.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        sets: exercise.sets,
        repsMin: exercise.repsMin ?? undefined,
        repsMax: exercise.repsMax ?? undefined,
        rir: exercise.rir ?? undefined,
        restSeconds: exercise.restSeconds ?? undefined,
        notes: exercise.notes ?? "",
      })),
    })),
  }));
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function RoutineBuilder({ routine }: { routine?: RoutineDetail }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [days, setDays] = useState<Day[]>(() => fromRoutine(routine));
  const form = useForm<HeaderValues>({
    resolver: zodResolver(routineHeaderSchema) as Resolver<HeaderValues>,
    defaultValues: {
      name: routine?.name ?? "",
      description: routine?.description ?? "",
      status: routine?.status ?? "DRAFT",
      notes: "",
    },
  });
  const exercises = useQuery({
    queryKey: ["routine-exercise-options"],
    queryFn: () => exerciseApi.list(new URLSearchParams({ limit: "50" })),
  });
  const mutation = useMutation({
    mutationFn: async (values: HeaderValues) => {
      const payload = { ...values, days };
      const parsed = routine
        ? routineVersionInputSchema.safeParse({ notes: values.notes, days })
        : routineInputSchema.safeParse(payload);
      if (!parsed.success)
        throw new Error(
          parsed.error.issues[0]?.message ??
            "Revisa la estructura de la rutina",
        );
      return routine
        ? routineApi.addVersion(routine.id, parsed.data)
        : routineApi.create(parsed.data);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["routines"] });
      void queryClient.invalidateQueries({ queryKey: ["routine", saved.id] });
      router.push(`/routines/${saved.id}`);
      router.refresh();
    },
  });
  const updateDay = (dayIndex: number, patch: Partial<Day>) =>
    setDays((current) =>
      current.map((day, index) =>
        index === dayIndex ? { ...day, ...patch } : day,
      ),
    );
  const updateBlock = (
    dayIndex: number,
    blockIndex: number,
    patch: Partial<Block>,
  ) =>
    setDays((current) =>
      current.map((day, currentDay) =>
        currentDay !== dayIndex
          ? day
          : {
              ...day,
              blocks: day.blocks.map((block, index) =>
                index === blockIndex ? { ...block, ...patch } : block,
              ),
            },
      ),
    );
  const updateEntry = (
    dayIndex: number,
    blockIndex: number,
    entryIndex: number,
    patch: Partial<Entry>,
  ) =>
    setDays((current) =>
      current.map((day, currentDay) =>
        currentDay !== dayIndex
          ? day
          : {
              ...day,
              blocks: day.blocks.map((block, currentBlock) =>
                currentBlock !== blockIndex
                  ? block
                  : {
                      ...block,
                      exercises: block.exercises.map((entry, index) =>
                        index === entryIndex ? { ...entry, ...patch } : entry,
                      ),
                    },
              ),
            },
      ),
    );
  const onSubmit = (values: HeaderValues) =>
    mutation.mutate(values, {
      onError: (error) => form.setError("root", { message: error.message }),
    });
  const isVersion = Boolean(routine);
  return (
    <section data-tour="routine-builder" className="mx-auto max-w-6xl">
      <Link
        href={routine ? `/routines/${routine.id}` : "/routines"}
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} />
        Volver a rutinas
      </Link>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
          <div className="flex flex-col justify-between gap-4 md:flex-row">
            <div>
              <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                Constructor versionado
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {isVersion
                  ? `Nueva versión · ${routine?.name}`
                  : "Nueva rutina"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {isVersion
                  ? "Las ediciones se guardan como una nueva instantánea y no alteran las asignaciones previas."
                  : "Define la primera versión de una plantilla reutilizable."}
              </p>
            </div>
            {isVersion && (
              <div className="bg-lavender/45 text-primary rounded-xl px-4 py-3 text-sm font-bold">
                Base: v{routine?.latestVersion}
              </div>
            )}
          </div>
          {!isVersion && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Nombre de la plantilla">
                <Input
                  {...form.register("name")}
                  className={inputClass}
                  placeholder="Ej. Hipertrofia · 4 días"
                />
              </Field>
              <Field label="Estado inicial">
                <select {...form.register("status")} className={inputClass}>
                  {Object.entries(routineStatusLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Descripción">
                <textarea
                  {...form.register("description")}
                  className="focus:border-primary focus:ring-primary/15 min-h-22 rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2"
                  placeholder="Objetivo, población o contexto de la plantilla."
                />
              </Field>
            </div>
          )}
          <div className="mt-5">
            <Field label="Notas de versión">
              <textarea
                {...form.register("notes")}
                className="focus:border-primary focus:ring-primary/15 min-h-20 rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2"
                placeholder="Qué cambió o qué debe recordar el coach."
              />
            </Field>
          </div>
        </div>
        <div className="space-y-4">
          {days.map((day, dayIndex) => (
            <div
              key={`${dayIndex}-${day.name}`}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(32,23,67,0.035)]"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <span className="bg-primary grid size-7 place-items-center rounded-lg text-xs font-bold text-white">
                  {dayIndex + 1}
                </span>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Nombre del día
                  <Input
                    value={day.name}
                    onChange={(event) =>
                      updateDay(dayIndex, { name: event.target.value })
                    }
                    className="h-9 max-w-xs border-slate-200 font-bold"
                    placeholder="Ej. Tren inferior"
                  />
                </label>
                <span className="text-xs font-medium text-slate-500">
                  {day.blocks.length} bloque{day.blocks.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDays((current) =>
                      current.filter((_, index) => index !== dayIndex),
                    )
                  }
                  disabled={days.length === 1}
                  className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                  aria-label="Eliminar día"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="space-y-4 p-5">
                {day.blocks.map((block, blockIndex) => (
                  <div
                    key={`${dayIndex}-${blockIndex}`}
                    className="border-purple/35 bg-lavender/15 rounded-xl border p-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="grid gap-1 text-xs font-semibold text-slate-600">
                        Tipo de bloque
                        <span className="relative">
                          <select
                            value={block.type}
                            onChange={(event) =>
                              updateBlock(dayIndex, blockIndex, {
                                type: event.target.value as RoutineBlockType,
                              })
                            }
                            className="border-purple/50 h-9 appearance-none rounded-lg border bg-white py-0 pr-9 pl-3 text-xs font-bold text-slate-700"
                          >
                            <option value="STRAIGHT_SET">
                              {blockTypeLabel.STRAIGHT_SET}
                            </option>
                            <option value="SUPERSET">
                              {blockTypeLabel.SUPERSET}
                            </option>
                            <option value="CIRCUIT">
                              {blockTypeLabel.CIRCUIT}
                            </option>
                          </select>
                          <ChevronDown
                            className="pointer-events-none absolute top-2 right-2 text-slate-400"
                            size={15}
                          />
                        </span>
                      </label>
                      <label className="grid gap-1 text-xs font-semibold text-slate-600">
                        Nombre del bloque
                        <Input
                          value={block.name ?? ""}
                          onChange={(event) =>
                            updateBlock(dayIndex, blockIndex, {
                              name: event.target.value,
                            })
                          }
                          className="border-purple/40 h-9 max-w-60"
                          placeholder="Opcional"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-semibold text-slate-600">
                        Descanso (segundos)
                        <Input
                          value={block.restSeconds ?? ""}
                          onChange={(event) =>
                            updateBlock(dayIndex, blockIndex, {
                              restSeconds:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                          className="border-purple/40 h-9 w-30"
                          type="number"
                          min="0"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateDay(dayIndex, {
                            blocks: day.blocks.filter(
                              (_, index) => index !== blockIndex,
                            ),
                          })
                        }
                        disabled={day.blocks.length === 1}
                        className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                        aria-label="Eliminar bloque"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {block.exercises.map((entry, entryIndex) => (
                        <div
                          key={`${dayIndex}-${blockIndex}-${entryIndex}`}
                          className="grid gap-2 rounded-lg border border-white bg-white/85 p-3 md:grid-cols-[minmax(12rem,1fr)_4.5rem_5rem_5rem_4.5rem_4.5rem_auto]"
                        >
                          <label className="grid gap-1 text-xs font-semibold text-slate-600">
                            Ejercicio
                            <select
                              value={entry.exerciseId}
                              onChange={(event) =>
                                updateEntry(dayIndex, blockIndex, entryIndex, {
                                  exerciseId: event.target.value,
                                })
                              }
                              className="focus:border-primary h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold outline-none"
                            >
                              <option value="">
                                {exercises.isPending
                                  ? "Cargando ejercicios…"
                                  : "Selecciona ejercicio"}
                              </option>
                              {exercises.data?.items.map((exercise) => (
                                <option key={exercise.id} value={exercise.id}>
                                  {exercise.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-1 text-xs font-semibold text-slate-600">
                            Series
                            <Input
                              value={entry.sets}
                              onChange={(event) =>
                                updateEntry(dayIndex, blockIndex, entryIndex, {
                                  sets: Number(event.target.value),
                                })
                              }
                              className="h-9 border-slate-200"
                              type="number"
                              min="1"
                            />
                          </label>
                          <label className="grid gap-1 text-xs font-semibold text-slate-600">
                            Repeticiones mínimas
                            <Input
                              value={entry.repsMin ?? ""}
                              onChange={(event) =>
                                updateEntry(dayIndex, blockIndex, entryIndex, {
                                  repsMin:
                                    event.target.value === ""
                                      ? undefined
                                      : Number(event.target.value),
                                })
                              }
                              className="h-9 border-slate-200"
                              type="number"
                              min="1"
                            />
                          </label>
                          <label className="grid gap-1 text-xs font-semibold text-slate-600">
                            Repeticiones máximas
                            <Input
                              value={entry.repsMax ?? ""}
                              onChange={(event) =>
                                updateEntry(dayIndex, blockIndex, entryIndex, {
                                  repsMax:
                                    event.target.value === ""
                                      ? undefined
                                      : Number(event.target.value),
                                })
                              }
                              className="h-9 border-slate-200"
                              type="number"
                              min="1"
                            />
                          </label>
                          <label className="grid gap-1 text-xs font-semibold text-slate-600">
                            RIR
                            <div className="flex min-w-0 items-center gap-1">
                              <Input
                                value={entry.rir ?? ""}
                                onChange={(event) =>
                                  updateEntry(
                                    dayIndex,
                                    blockIndex,
                                    entryIndex,
                                    {
                                      rir:
                                        event.target.value === ""
                                          ? undefined
                                          : Number(event.target.value),
                                    },
                                  )
                                }
                                className="h-9 min-w-0 w-auto flex-1 border-slate-200"
                                type="number"
                                min="0"
                                max="5"
                                step="0.5"
                              />
                              <TermTooltip term="RIR" />
                            </div>
                          </label>
                          <label className="grid gap-1 text-xs font-semibold text-slate-600">
                            Descanso (segundos)
                            <Input
                              value={entry.restSeconds ?? ""}
                              onChange={(event) =>
                                updateEntry(dayIndex, blockIndex, entryIndex, {
                                  restSeconds:
                                    event.target.value === ""
                                      ? undefined
                                      : Number(event.target.value),
                                })
                              }
                              className="h-9 border-slate-200"
                              type="number"
                              min="0"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(dayIndex, blockIndex, {
                                exercises: block.exercises.filter(
                                  (_, index) => index !== entryIndex,
                                ),
                              })
                            }
                            disabled={block.exercises.length === 1}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                            aria-label="Eliminar ejercicio"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(dayIndex, blockIndex, {
                          exercises: [...block.exercises, newEntry()],
                        })
                      }
                      className="text-primary mt-3 inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
                    >
                      <Plus size={14} />
                      Agregar ejercicio
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateDay(dayIndex, { blocks: [...day.blocks, newBlock()] })
                  }
                  className="border-primary/40 text-primary hover:bg-lavender/35 inline-flex h-9 items-center gap-2 rounded-lg border border-dashed px-3 text-xs font-bold"
                >
                  <Plus size={14} />
                  Agregar bloque
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setDays((current) => [...current, newDay(current.length + 1)])
          }
          className="border-primary/45 text-primary hover:bg-lavender/25 inline-flex h-11 items-center gap-2 rounded-xl border border-dashed bg-white px-4 text-sm font-bold"
        >
          <Plus size={17} />
          Agregar día
        </button>
        {form.formState.errors.root && (
          <p role="alert" className="text-sm font-medium text-rose-600">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Link
            href={routine ? `/routines/${routine.id}` : "/routines"}
            className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={mutation.isPending}>
            <Save size={16} />
            {mutation.isPending
              ? "Guardando…"
              : isVersion
                ? "Crear nueva versión"
                : "Crear rutina"}
          </Button>
        </div>
      </form>
    </section>
  );
}
