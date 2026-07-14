"use client";

import Link from "next/link";
import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Resolver, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  equipmentLabel,
  measurementTypeLabel,
  movementPatternLabel,
  muscleLabel,
  progressionPolicyLabel,
} from "@/features/exercises/exercise-labels";
import { exerciseInputSchema } from "@/features/exercises/schemas/exercise.schema";
import { exerciseApi } from "@/features/exercises/services/exercise-api";
import type {
  EquipmentType,
  Exercise,
  MeasurementType,
  MovementPattern,
  MuscleGroup,
  ProgressionPolicy,
} from "@/features/exercises/types/exercise";

type ExerciseFormValues = {
  name: string;
  description?: string;
  measurementType: MeasurementType;
  equipment: EquipmentType;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  movementPattern: MovementPattern;
  minimumIncrement?: number;
  progressionPolicy: ProgressionPolicy;
  substituteIds: string[];
};
const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15";
const muscleGroups = Object.keys(muscleLabel) as MuscleGroup[];

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

function MusclePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MuscleGroup[];
  onChange: (value: MuscleGroup[]) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {muscleGroups.map((muscle) => {
          const selected = value.includes(muscle);
          return (
            <button
              key={muscle}
              type="button"
              onClick={() =>
                onChange(
                  selected ? value.filter((item) => item !== muscle) : [...value, muscle],
                )
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected ? "border-primary bg-primary text-white" : "hover:border-purple border-slate-200 bg-white text-slate-600"}`}
            >
              {muscleLabel[muscle]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function defaults(exercise?: Exercise): ExerciseFormValues {
  return {
    name: exercise?.name ?? "",
    description: exercise?.description ?? "",
    measurementType: exercise?.measurementType ?? "WEIGHT_REPS",
    equipment: exercise?.equipment ?? "BARBELL",
    primaryMuscles: exercise?.primaryMuscles ?? [],
    secondaryMuscles: exercise?.secondaryMuscles ?? [],
    movementPattern: exercise?.movementPattern ?? "SQUAT",
    minimumIncrement: exercise?.minimumIncrement ?? undefined,
    progressionPolicy: exercise?.progressionPolicy ?? "DOUBLE_PROGRESSION",
    substituteIds: exercise?.substitutes.map((substitute) => substitute.id) ?? [],
  };
}

export function ExerciseForm({ exercise }: { exercise?: Exercise }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseInputSchema) as Resolver<ExerciseFormValues>,
    defaultValues: defaults(exercise),
    mode: "onBlur",
  });
  const options = useQuery({
    queryKey: ["exercise-options"],
    queryFn: () => exerciseApi.list(new URLSearchParams({ limit: "50" })),
  });
  const substitutes = useMemo(
    () => options.data?.items.filter((item) => item.id !== exercise?.id) ?? [],
    [exercise?.id, options.data?.items],
  );
  const mutation = useMutation({
    mutationFn: (values: ExerciseFormValues) =>
      exercise ? exerciseApi.update(exercise.id, values) : exerciseApi.create(values),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["exercises"] });
      void queryClient.invalidateQueries({ queryKey: ["exercise", saved.id] });
      router.push(`/exercises/${saved.id}`);
      router.refresh();
    },
  });
  const onSubmit = (values: ExerciseFormValues) =>
    mutation.mutate(values, {
      onError: (error) => form.setError("root", { message: error.message }),
    });
  const primaryMuscles =
    useWatch({ control: form.control, name: "primaryMuscles" }) ?? [];
  const secondaryMuscles =
    useWatch({ control: form.control, name: "secondaryMuscles" }) ?? [];
  const selectedSubstitutes =
    useWatch({ control: form.control, name: "substituteIds" }) ?? [];

  return (
    <section className="mx-auto max-w-4xl">
      <Link
        href={exercise ? `/exercises/${exercise.id}` : "/exercises"}
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} />
        Volver a ejercicios
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
            Biblioteca de entrenamiento
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {exercise ? "Editar ejercicio" : "Nuevo ejercicio"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define los datos necesarios para prescribir y progresar el movimiento de forma
            consistente.
          </p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nombre" error={form.formState.errors.name?.message}>
              <Input
                {...form.register("name")}
                className={inputClass}
                placeholder="Ej. Press inclinado con mancuernas"
              />
            </Field>
            <Field label="Equipo">
              <select {...form.register("equipment")} className={inputClass}>
                {Object.entries(equipmentLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de medición">
              <select {...form.register("measurementType")} className={inputClass}>
                {Object.entries(measurementTypeLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Patrón de movimiento">
              <select {...form.register("movementPattern")} className={inputClass}>
                {Object.entries(movementPatternLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Incremento mínimo (kg)"
              error={form.formState.errors.minimumIncrement?.message}
            >
              <Input
                {...form.register("minimumIncrement", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                className={inputClass}
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                placeholder="Ej. 2.5"
              />
            </Field>
            <Field label="Política de progresión">
              <select {...form.register("progressionPolicy")} className={inputClass}>
                {Object.entries(progressionPolicyLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Descripción" error={form.formState.errors.description?.message}>
            <textarea
              {...form.register("description")}
              className="focus:border-primary focus:ring-primary/15 min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2"
              placeholder="Indicaciones breves de técnica o contexto."
            />
          </Field>
          <MusclePicker
            label="Músculos principales"
            value={primaryMuscles}
            onChange={(value) =>
              form.setValue("primaryMuscles", value, { shouldValidate: true })
            }
          />
          {form.formState.errors.primaryMuscles?.message && (
            <p className="-mt-5 text-xs font-medium text-rose-600">
              {form.formState.errors.primaryMuscles.message}
            </p>
          )}
          <MusclePicker
            label="Músculos secundarios"
            value={secondaryMuscles}
            onChange={(value) => form.setValue("secondaryMuscles", value)}
          />
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Sustituciones aprobadas
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Se muestran como alternativas al prescribir; no cambian los datos del
              ejercicio original.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {options.isPending ? (
                <p className="text-sm text-slate-500">Cargando biblioteca…</p>
              ) : substitutes.length ? (
                substitutes.map((substitute) => {
                  const checked = selectedSubstitutes.includes(substitute.id);
                  return (
                    <label
                      key={substitute.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${checked ? "border-primary bg-lavender/35" : "hover:border-purple border-slate-200"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          form.setValue(
                            "substituteIds",
                            checked
                              ? selectedSubstitutes.filter((id) => id !== substitute.id)
                              : [...selectedSubstitutes, substitute.id],
                            { shouldValidate: true },
                          )
                        }
                        className="accent-primary"
                      />
                      <span>
                        <span className="block font-semibold">{substitute.name}</span>
                        <span className="text-xs text-slate-500">
                          {equipmentLabel[substitute.equipment]}
                        </span>
                      </span>
                    </label>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">
                  Aún no hay otros ejercicios disponibles.
                </p>
              )}
            </div>
          </div>
          {form.formState.errors.root && (
            <p role="alert" className="text-sm font-medium text-rose-600">
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Link
              href={exercise ? `/exercises/${exercise.id}` : "/exercises"}
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Link>
            <Button type="submit" disabled={mutation.isPending}>
              <Save size={16} />
              {mutation.isPending
                ? "Guardando…"
                : exercise
                  ? "Guardar cambios"
                  : "Crear ejercicio"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
