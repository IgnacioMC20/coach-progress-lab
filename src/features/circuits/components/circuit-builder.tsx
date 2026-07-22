"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Resolver, useFieldArray, useForm } from "react-hook-form";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/shared/empty-state";
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
import { applyApiError } from "@/lib/form-errors";

type CircuitFormValues = {
  name: string;
  description?: string;
  status: CircuitStatus;
  rounds: number;
  restBetweenRoundsSeconds?: number;
  notes?: string;
  exercises: Array<{
    exerciseId: string;
    reps?: number;
    targetWeightKg?: number;
    durationSeconds?: number;
    notes?: string;
  }>;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition aria-invalid:border-rose-400 aria-invalid:ring-2 aria-invalid:ring-rose-100 focus:border-primary focus:ring-2 focus:ring-primary/15";
const numberValue = {
  setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
};
const newExercise = (): CircuitFormValues["exercises"][number] => ({
  exerciseId: "",
  reps: 10,
  targetWeightKg: undefined,
  durationSeconds: undefined,
  notes: "",
});

function defaults(circuit?: CircuitDetail): CircuitFormValues {
  const version = circuit?.currentVersion;
  return {
    name: circuit?.name ?? "",
    description: circuit?.description ?? "",
    status: circuit?.status ?? "DRAFT",
    rounds: version?.rounds ?? 3,
    restBetweenRoundsSeconds: version?.restBetweenRoundsSeconds ?? 60,
    notes: version?.notes ?? "",
    exercises: version?.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      reps: exercise.reps ?? undefined,
      targetWeightKg: exercise.targetWeightKg ?? undefined,
      durationSeconds: exercise.durationSeconds ?? undefined,
      notes: exercise.notes ?? "",
    })) ?? [newExercise()],
  };
}

function nestedMessage(error: unknown) {
  return typeof error === "object" && error && "message" in error
    ? String((error as { message?: unknown }).message ?? "")
    : undefined;
}

export function CircuitBuilder({ circuit }: { circuit?: CircuitDetail }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const form = useForm<CircuitFormValues>({
    resolver: zodResolver(circuitInputSchema, undefined, {
      raw: true,
    }) as Resolver<CircuitFormValues>,
    defaultValues: defaults(circuit),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const exerciseFields = useFieldArray({
    control: form.control,
    name: "exercises",
  });
  const exerciseOptions = useQuery({
    queryKey: ["circuit-exercise-options"],
    queryFn: () => exerciseApi.list(new URLSearchParams({ limit: "50" })),
  });
  const noExercises =
    exerciseOptions.isSuccess && exerciseOptions.data.items.length === 0;
  const canSave =
    exerciseOptions.isSuccess && exerciseOptions.data.items.length > 0;
  const isVersion = Boolean(circuit);

  const mutation = useMutation({
    mutationFn: (values: CircuitFormValues) => {
      if (noExercises)
        throw new Error(
          "Crea al menos un ejercicio antes de guardar un circuito.",
        );
      if (circuit) {
        const versionValues = {
          rounds: values.rounds,
          restBetweenRoundsSeconds: values.restBetweenRoundsSeconds,
          notes: values.notes,
          exercises: values.exercises,
        };
        const parsed = circuitVersionInputSchema.safeParse(versionValues);
        if (!parsed.success) throw parsed.error;
        return circuitApi.addVersion(circuit.id, versionValues);
      }
      return circuitApi.create(values);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["circuits"] });
      void queryClient.invalidateQueries({ queryKey: ["circuit", saved.id] });
      toast.success(
        isVersion ? "Nueva versión creada" : "Circuito creado",
        saved.name,
      );
      router.push(`/circuits/${saved.id}`);
      router.refresh();
    },
  });

  const submit = (values: CircuitFormValues) =>
    mutation.mutate(values, {
      onError: (error) => {
        const message = applyApiError(error, form.setError);
        toast.error("No pudimos guardar el circuito", message);
      },
    });

  return (
    <section data-tour="circuit-builder" className="mx-auto max-w-5xl">
      <Link
        href={circuit ? `/circuits/${circuit.id}` : "/circuits"}
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} /> Volver a circuitos
      </Link>
      {noExercises ? (
        <div className="mt-5">
          <EmptyState
            title="Aún no hay ejercicios disponibles"
            description="El circuito necesita al menos un ejercicio de la biblioteca."
            action={
              <Link
                href="/exercises/new"
                className="bg-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white hover:opacity-90"
              >
                Crear ejercicio
              </Link>
            }
          />
        </div>
      ) : null}
      <form
        onSubmit={form.handleSubmit(submit, () =>
          toast.error(
            "Revisa los campos marcados",
            "Corrige los errores antes de guardar.",
          ),
        )}
        className="mt-5 space-y-5"
        noValidate
      >
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
          <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
            Circuito versionado
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {isVersion ? `Nueva versión · ${circuit?.name}` : "Nuevo circuito"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Los campos indican si son obligatorios u opcionales.
          </p>
          {!isVersion ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormField
                name="name"
                label="Nombre del circuito"
                required
                hint="Entre 2 y 120 caracteres."
                error={form.formState.errors.name?.message}
              >
                <Input
                  {...form.register("name")}
                  className={inputClass}
                  placeholder="Ej. Finisher metabólico"
                />
              </FormField>
              <FormField
                name="status"
                label="Estado inicial"
                required
                error={form.formState.errors.status?.message}
              >
                <select {...form.register("status")} className={inputClass}>
                  {Object.entries(circuitStatusLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                name="description"
                label="Descripción"
                hint="Máximo 2,000 caracteres."
                error={form.formState.errors.description?.message}
                className="md:col-span-2"
              >
                <textarea
                  {...form.register("description")}
                  className="min-h-22 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none aria-invalid:border-rose-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="Objetivo y contexto del circuito."
                />
              </FormField>
            </div>
          ) : null}
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormField
              name="rounds"
              label="Rondas"
              required
              hint="Número entero entre 1 y 50."
              error={form.formState.errors.rounds?.message}
            >
              <Input
                {...form.register("rounds", numberValue)}
                className={inputClass}
                type="number"
                min="1"
                max="50"
              />
            </FormField>
            <FormField
              name="restBetweenRoundsSeconds"
              label="Descanso entre rondas (segundos)"
              hint="Entre 0 y 3,600 segundos."
              error={form.formState.errors.restBetweenRoundsSeconds?.message}
            >
              <Input
                {...form.register("restBetweenRoundsSeconds", numberValue)}
                className={inputClass}
                type="number"
                min="0"
                max="3600"
              />
            </FormField>
            <FormField
              name="notes"
              label="Notas de versión"
              hint="Máximo 2,000 caracteres."
              error={form.formState.errors.notes?.message}
              className="md:col-span-2"
            >
              <textarea
                {...form.register("notes")}
                className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none aria-invalid:border-rose-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="Indicaciones para ejecutar este circuito."
              />
            </FormField>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
          <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
            Ejercicios
          </p>
          <h2 className="mt-1 text-xl font-bold">Secuencia del circuito</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cada ejercicio necesita repeticiones o duración.
          </p>
          <div className="mt-5 space-y-3">
            {exerciseFields.fields.map((field, index) => {
              const error = form.formState.errors.exercises?.[index];
              return (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-[minmax(12rem,1fr)_7rem_8rem_8rem_auto]"
                >
                  <FormField
                    name={`exercises.${index}.exerciseId`}
                    label="Ejercicio"
                    required
                    error={error?.exerciseId?.message}
                  >
                    <select
                      {...form.register(`exercises.${index}.exerciseId`)}
                      disabled={noExercises}
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
                  </FormField>
                  <FormField
                    name={`exercises.${index}.reps`}
                    label="Repeticiones"
                    error={error?.reps?.message}
                  >
                    <Input
                      {...form.register(`exercises.${index}.reps`, numberValue)}
                      type="number"
                      min="1"
                      max="500"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField
                    name={`exercises.${index}.targetWeightKg`}
                    label="Carga objetivo (kg)"
                    hint="0 a 1,000 kg."
                    error={error?.targetWeightKg?.message}
                  >
                    <Input
                      {...form.register(
                        `exercises.${index}.targetWeightKg`,
                        numberValue,
                      )}
                      type="number"
                      min="0"
                      max="1000"
                      step="0.5"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField
                    name={`exercises.${index}.durationSeconds`}
                    label="Duración (segundos)"
                    error={error?.durationSeconds?.message}
                  >
                    <Input
                      {...form.register(
                        `exercises.${index}.durationSeconds`,
                        numberValue,
                      )}
                      type="number"
                      min="1"
                      max="86400"
                      className={inputClass}
                    />
                  </FormField>
                  <button
                    type="button"
                    onClick={() => exerciseFields.remove(index)}
                    disabled={exerciseFields.fields.length === 1}
                    className="self-end rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                    aria-label={`Eliminar ejercicio ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                  <FormField
                    name={`exercises.${index}.notes`}
                    label="Notas del ejercicio"
                    hint="Máximo 2,000 caracteres."
                    error={error?.notes?.message}
                    className="md:col-span-4"
                  >
                    <Input
                      {...form.register(`exercises.${index}.notes`)}
                      className={inputClass}
                      placeholder="Técnica, ritmo o alternativa."
                    />
                  </FormField>
                  {nestedMessage(error) ? (
                    <div className="md:col-span-5">
                      <FormAlert message={nestedMessage(error)} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => exerciseFields.append(newExercise())}
            className="border-primary/40 text-primary hover:bg-lavender/35 mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-dashed px-3 text-xs font-bold"
          >
            <Plus size={14} /> Agregar ejercicio
          </button>
          <FormAlert message={nestedMessage(form.formState.errors.exercises)} />
        </div>
        <FormAlert message={form.formState.errors.root?.server?.message} />
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending || !canSave}>
            <Save size={16} />{" "}
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
