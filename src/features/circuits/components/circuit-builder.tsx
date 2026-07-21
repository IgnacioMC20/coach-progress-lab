"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Resolver, useForm } from "react-hook-form";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { circuitStatusLabel } from "@/features/circuits/circuit-labels";
import {
  circuitInputSchema,
  circuitVersionInputSchema,
} from "@/features/circuits/schemas/circuit.schema";
import { circuitApi } from "@/features/circuits/services/circuit-api";
import type {
  CircuitDetail,
  CircuitStatus,
} from "@/features/circuits/types/circuit";
import { exerciseApi } from "@/features/exercises/services/exercise-api";

type Entry = {
  exerciseId: string;
  reps?: number;
  targetWeightKg?: number;
  durationSeconds?: number;
  notes?: string;
};
type HeaderValues = {
  name: string;
  description?: string;
  status: CircuitStatus;
  rounds: number;
  restBetweenRoundsSeconds?: number;
  notes?: string;
};
const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
const number = (value: string) => (value === "" ? undefined : Number(value));
const newEntry = (): Entry => ({ exerciseId: "", reps: 10 });
const headerSchema = circuitInputSchema
  .pick({ name: true, description: true, status: true })
  .extend({
    rounds: circuitVersionInputSchema.shape.rounds,
    restBetweenRoundsSeconds:
      circuitVersionInputSchema.shape.restBetweenRoundsSeconds,
    notes: circuitVersionInputSchema.shape.notes,
  });

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

export function CircuitBuilder({ circuit }: { circuit?: CircuitDetail }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const version = circuit?.currentVersion;
  const [exercises, setExercises] = useState<Entry[]>(() =>
    version
      ? version.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          reps: exercise.reps ?? undefined,
          targetWeightKg: exercise.targetWeightKg ?? undefined,
          durationSeconds: exercise.durationSeconds ?? undefined,
          notes: exercise.notes ?? "",
        }))
      : [newEntry()],
  );
  const form = useForm<HeaderValues>({
    resolver: zodResolver(headerSchema) as Resolver<HeaderValues>,
    defaultValues: {
      name: circuit?.name ?? "",
      description: circuit?.description ?? "",
      status: circuit?.status ?? "DRAFT",
      rounds: version?.rounds ?? 3,
      restBetweenRoundsSeconds: version?.restBetweenRoundsSeconds ?? 60,
      notes: version?.notes ?? "",
    },
  });
  const exerciseOptions = useQuery({
    queryKey: ["circuit-exercise-options"],
    queryFn: () => exerciseApi.list(new URLSearchParams({ limit: "50" })),
  });
  const mutation = useMutation({
    mutationFn: (values: HeaderValues) => {
      const payload = { ...values, exercises };
      const parsed = circuit
        ? circuitVersionInputSchema.safeParse({
            rounds: values.rounds,
            restBetweenRoundsSeconds: values.restBetweenRoundsSeconds,
            notes: values.notes,
            exercises,
          })
        : circuitInputSchema.safeParse(payload);
      if (!parsed.success)
        throw new Error(
          parsed.error.issues[0]?.message ?? "Revisa el circuito",
        );
      return circuit
        ? circuitApi.addVersion(circuit.id, parsed.data)
        : circuitApi.create(parsed.data);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["circuits"] });
      void queryClient.invalidateQueries({ queryKey: ["circuit", saved.id] });
      router.push(`/circuits/${saved.id}`);
      router.refresh();
    },
  });
  const updateEntry = (index: number, patch: Partial<Entry>) =>
    setExercises((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    );
  const isVersion = Boolean(circuit);
  return (
    <section data-tour="circuit-builder" className="mx-auto max-w-5xl">
      <Link
        href={circuit ? `/circuits/${circuit.id}` : "/circuits"}
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} /> Volver a circuitos
      </Link>
      <form
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate(values, {
            onError: (error) =>
              form.setError("root", { message: error.message }),
          }),
        )}
        className="mt-5 space-y-5"
      >
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
          <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
            Circuito versionado
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {isVersion ? `Nueva versión · ${circuit?.name}` : "Nuevo circuito"}
          </h1>
          {!isVersion && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Nombre del circuito">
                <Input
                  {...form.register("name")}
                  className={inputClass}
                  placeholder="Ej. Finisher metabólico"
                />
              </Field>
              <Field label="Estado inicial">
                <select {...form.register("status")} className={inputClass}>
                  {Object.entries(circuitStatusLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Descripción">
                  <textarea
                    {...form.register("description")}
                    className="min-h-22 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    placeholder="Objetivo y contexto del circuito."
                  />
                </Field>
              </div>
            </div>
          )}
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Rondas">
              <Input
                {...form.register("rounds", { setValueAs: number })}
                className={inputClass}
                type="number"
                min="1"
              />
            </Field>
            <Field label="Descanso entre rondas (segundos)">
              <Input
                {...form.register("restBetweenRoundsSeconds", {
                  setValueAs: number,
                })}
                className={inputClass}
                type="number"
                min="0"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notas de versión">
                <textarea
                  {...form.register("notes")}
                  className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="Indicaciones para ejecutar este circuito."
                />
              </Field>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
          <div>
            <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
              Ejercicios
            </p>
            <h2 className="mt-1 text-xl font-bold">Secuencia del circuito</h2>
          </div>
          <div className="mt-5 space-y-3">
            {exercises.map((entry, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-[minmax(12rem,1fr)_7rem_8rem_8rem_auto]"
              >
                <Field label="Ejercicio">
                  <select
                    value={entry.exerciseId}
                    onChange={(event) =>
                      updateEntry(index, { exerciseId: event.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">
                      {exerciseOptions.isPending
                        ? "Cargando ejercicios…"
                        : "Selecciona un ejercicio"}
                    </option>
                    {exerciseOptions.data?.items.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Repeticiones">
                  <Input
                    value={entry.reps ?? ""}
                    onChange={(event) =>
                      updateEntry(index, { reps: number(event.target.value) })
                    }
                    type="number"
                    min="1"
                    className={inputClass}
                  />
                </Field>
                <Field label="Carga objetivo (kg)">
                  <Input
                    value={entry.targetWeightKg ?? ""}
                    onChange={(event) =>
                      updateEntry(index, {
                        targetWeightKg: number(event.target.value),
                      })
                    }
                    type="number"
                    min="0"
                    step="0.5"
                    className={inputClass}
                  />
                </Field>
                <Field label="Duración (segundos)">
                  <Input
                    value={entry.durationSeconds ?? ""}
                    onChange={(event) =>
                      updateEntry(index, {
                        durationSeconds: number(event.target.value),
                      })
                    }
                    type="number"
                    min="1"
                    className={inputClass}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() =>
                    setExercises((current) =>
                      current.filter((_, entryIndex) => entryIndex !== index),
                    )
                  }
                  disabled={exercises.length === 1}
                  className="self-end rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                  aria-label="Eliminar ejercicio"
                >
                  <Trash2 size={16} />
                </button>
                <div className="md:col-span-4">
                  <Field label="Notas del ejercicio">
                    <Input
                      value={entry.notes ?? ""}
                      onChange={(event) =>
                        updateEntry(index, { notes: event.target.value })
                      }
                      className={inputClass}
                      placeholder="Técnica, ritmo o alternativa."
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setExercises((current) => [...current, newEntry()])}
            className="border-primary/40 text-primary hover:bg-lavender/35 mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-dashed px-3 text-xs font-bold"
          >
            <Plus size={14} /> Agregar ejercicio
          </button>
        </div>
        {form.formState.errors.root && (
          <p role="alert" className="text-sm font-medium text-rose-600">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            <Save size={16} />
            {mutation.isPending
              ? "Guardando…"
              : isVersion
                ? "Crear nueva versión"
                : "Crear circuito"}
          </Button>
        </div>
      </form>
    </section>
  );
}
