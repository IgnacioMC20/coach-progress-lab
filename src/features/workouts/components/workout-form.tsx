"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientApi } from "@/features/clients/services/client-api";
import { exerciseApi } from "@/features/exercises/services/exercise-api";
import { techniqueLabel, workoutStatusLabel } from "@/features/workouts/workout-labels";
import { workoutApi } from "@/features/workouts/services/workout-api";
import {
  workoutInputSchema,
  workoutUpdateSchema,
} from "@/features/workouts/schemas/workout.schema";
import type {
  TechniqueStatus,
  WorkoutSession,
  WorkoutSessionStatus,
} from "@/features/workouts/types/workout";

type LoggedSet = {
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  rir?: number;
  technique?: TechniqueStatus;
  painLevel?: number;
  notes?: string;
};
type LoggedExercise = { exerciseId: string; notes?: string; sets: LoggedSet[] };
type HeaderValues = {
  clientId: string;
  performedAt: string;
  status: WorkoutSessionStatus;
  notes?: string;
};
const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15";
const newSet = (): LoggedSet => ({
  weightKg: undefined,
  reps: 10,
  rir: 2,
  technique: "GOOD",
  painLevel: 0,
});
const newExercise = (): LoggedExercise => ({ exerciseId: "", sets: [newSet()] });
const dateNow = () => new Date().toISOString().slice(0, 10);
function fromWorkout(workout?: WorkoutSession): LoggedExercise[] {
  return (
    workout?.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      notes: exercise.notes ?? "",
      sets: exercise.sets.map((set) => ({
        weightKg: set.weightKg ?? undefined,
        reps: set.reps ?? undefined,
        durationSeconds: set.durationSeconds ?? undefined,
        rir: set.rir ?? undefined,
        technique: set.technique ?? undefined,
        painLevel: set.painLevel ?? undefined,
        notes: set.notes ?? "",
      })),
    })) ?? [newExercise()]
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function WorkoutForm({ workout }: { workout?: WorkoutSession }) {
  const router = useRouter();
  const search = useSearchParams();
  const queryClient = useQueryClient();
  const [exercises, setExercises] = useState<LoggedExercise[]>(() =>
    fromWorkout(workout),
  );
  const form = useForm<HeaderValues>({
    defaultValues: {
      clientId: workout?.clientId ?? search.get("clientId") ?? "",
      performedAt: workout?.performedAt.slice(0, 10) ?? dateNow(),
      status: workout?.status ?? "IN_PROGRESS",
      notes: workout?.notes ?? "",
    },
  });
  const clients = useQuery({
    queryKey: ["workout-form-clients"],
    queryFn: () => clientApi.list(new URLSearchParams({ limit: "50", status: "ACTIVE" })),
  });
  const exerciseOptions = useQuery({
    queryKey: ["workout-form-exercises"],
    queryFn: () => exerciseApi.list(new URLSearchParams({ limit: "50" })),
  });
  const mutation = useMutation({
    mutationFn: (values: HeaderValues) => {
      const payload = { ...values, exercises };
      const parsed = workout
        ? workoutUpdateSchema.safeParse(payload)
        : workoutInputSchema.safeParse(payload);
      if (!parsed.success)
        throw new Error(
          parsed.error.issues[0]?.message ?? "Revisa los datos del entrenamiento",
        );
      return workout
        ? workoutApi.update(workout.id, parsed.data)
        : workoutApi.create(parsed.data);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["workouts"] });
      void queryClient.invalidateQueries({ queryKey: ["workout", saved.id] });
      router.push(`/workouts/${saved.id}`);
      router.refresh();
    },
  });
  const updateExercise = (exerciseIndex: number, patch: Partial<LoggedExercise>) =>
    setExercises((current) =>
      current.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, ...patch } : exercise,
      ),
    );
  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    patch: Partial<LoggedSet>,
  ) =>
    setExercises((current) =>
      current.map((exercise, currentExercise) =>
        currentExercise !== exerciseIndex
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set, index) =>
                index === setIndex ? { ...set, ...patch } : set,
              ),
            },
      ),
    );
  const onSubmit = (values: HeaderValues) =>
    mutation.mutate(values, {
      onError: (error) => form.setError("root", { message: error.message }),
    });
  return (
    <section className="mx-auto max-w-6xl">
      <Link
        href={workout ? `/workouts/${workout.id}` : "/workouts"}
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} />
        Volver a entrenamientos
      </Link>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
          <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
            Registro de ejecución
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {workout ? "Editar sesión" : "Nueva sesión"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Registra lo realizado serie por serie, incluidas señales de técnica y dolor.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <Field label="Cliente">
              <select
                {...form.register("clientId")}
                disabled={Boolean(workout)}
                className={inputClass}
              >
                <option value="">Seleccionar cliente</option>
                {clients.data?.items.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha">
              <Input
                {...form.register("performedAt")}
                className={inputClass}
                type="date"
              />
            </Field>
            <Field label="Estado">
              <select {...form.register("status")} className={inputClass}>
                {Object.entries(workoutStatusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-5">
            <Field label="Observaciones de sesión">
              <textarea
                {...form.register("notes")}
                className="focus:border-primary focus:ring-primary/15 min-h-20 rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2"
                placeholder="Energía general, contexto o notas relevantes."
              />
            </Field>
          </div>
        </div>
        <div className="space-y-4">
          {exercises.map((exercise, exerciseIndex) => (
            <div
              key={`${exerciseIndex}-${exercise.exerciseId}`}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-primary grid size-7 place-items-center rounded-lg text-xs font-bold text-white">
                  {exerciseIndex + 1}
                </span>
                <select
                  value={exercise.exerciseId}
                  onChange={(event) =>
                    updateExercise(exerciseIndex, { exerciseId: event.target.value })
                  }
                  className="focus:border-primary h-10 min-w-56 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none"
                >
                  <option value="">
                    {exerciseOptions.isPending
                      ? "Cargando ejercicios…"
                      : "Seleccionar ejercicio"}
                  </option>
                  {exerciseOptions.data?.items.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setExercises((current) =>
                      current.filter((_, index) => index !== exerciseIndex),
                    )
                  }
                  disabled={exercises.length === 1}
                  className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                  aria-label="Eliminar ejercicio"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={`${exerciseIndex}-${setIndex}`}
                    className="border-purple/30 bg-lavender/15 rounded-xl border p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-primary text-xs font-bold">
                        Serie {setIndex + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          updateExercise(exerciseIndex, {
                            sets: exercise.sets.filter((_, index) => index !== setIndex),
                          })
                        }
                        disabled={exercise.sets.length === 1}
                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                        aria-label="Eliminar serie"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                      <Input
                        value={set.weightKg ?? ""}
                        onChange={(event) =>
                          updateSet(exerciseIndex, setIndex, {
                            weightKg:
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                          })
                        }
                        className="border-purple/35 h-9"
                        type="number"
                        min="0"
                        step="0.5"
                        aria-label="Peso en kilogramos"
                        placeholder="Peso kg"
                      />
                      <Input
                        value={set.reps ?? ""}
                        onChange={(event) =>
                          updateSet(exerciseIndex, setIndex, {
                            reps:
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                          })
                        }
                        className="border-purple/35 h-9"
                        type="number"
                        min="0"
                        aria-label="Repeticiones"
                        placeholder="Reps"
                      />
                      <Input
                        value={set.durationSeconds ?? ""}
                        onChange={(event) =>
                          updateSet(exerciseIndex, setIndex, {
                            durationSeconds:
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                          })
                        }
                        className="border-purple/35 h-9"
                        type="number"
                        min="0"
                        aria-label="Duración en segundos"
                        placeholder="Tiempo s"
                      />
                      <Input
                        value={set.rir ?? ""}
                        onChange={(event) =>
                          updateSet(exerciseIndex, setIndex, {
                            rir:
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                          })
                        }
                        className="border-purple/35 h-9"
                        type="number"
                        min="0"
                        max="5"
                        step="0.5"
                        aria-label="RIR"
                        placeholder="RIR"
                      />
                      <select
                        value={set.technique ?? ""}
                        onChange={(event) =>
                          updateSet(exerciseIndex, setIndex, {
                            technique: event.target.value
                              ? (event.target.value as TechniqueStatus)
                              : undefined,
                          })
                        }
                        className="border-purple/35 h-9 rounded-lg border bg-white px-2 text-xs outline-none"
                      >
                        <option value="">Técnica</option>
                        {Object.entries(techniqueLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={set.painLevel ?? ""}
                        onChange={(event) =>
                          updateSet(exerciseIndex, setIndex, {
                            painLevel:
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                          })
                        }
                        className="border-purple/35 h-9"
                        type="number"
                        min="0"
                        max="10"
                        aria-label="Nivel de dolor"
                        placeholder="Dolor 0–10"
                      />
                      <Input
                        value={set.notes ?? ""}
                        onChange={(event) =>
                          updateSet(exerciseIndex, setIndex, {
                            notes: event.target.value,
                          })
                        }
                        className="border-purple/35 h-9"
                        aria-label="Notas de serie"
                        placeholder="Nota"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  updateExercise(exerciseIndex, { sets: [...exercise.sets, newSet()] })
                }
                className="text-primary mt-3 inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
              >
                <Plus size={14} />
                Agregar serie
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExercises((current) => [...current, newExercise()])}
          className="border-primary/45 text-primary hover:bg-lavender/25 inline-flex h-11 items-center gap-2 rounded-xl border border-dashed bg-white px-4 text-sm font-bold"
        >
          <Plus size={17} />
          Agregar ejercicio
        </button>
        {form.formState.errors.root && (
          <p role="alert" className="text-sm font-medium text-rose-600">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Link
            href={workout ? `/workouts/${workout.id}` : "/workouts"}
            className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={mutation.isPending}>
            <Save size={16} />
            {mutation.isPending
              ? "Guardando…"
              : workout
                ? "Guardar sesión"
                : "Registrar sesión"}
          </Button>
        </div>
      </form>
    </section>
  );
}
