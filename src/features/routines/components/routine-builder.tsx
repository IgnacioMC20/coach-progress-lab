"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FormProvider,
  type Resolver,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/shared/empty-state";
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
import { applyApiError } from "@/lib/form-errors";

type RoutineFormValues = {
  name: string;
  description?: string;
  status: RoutineStatus;
  notes?: string;
  days: Array<{
    name: string;
    blocks: Array<{
      name?: string;
      type: RoutineBlockType;
      restSeconds?: number;
      exercises: Array<{
        exerciseId: string;
        sets: number;
        repsMin?: number;
        repsMax?: number;
        rir?: number;
        restSeconds?: number;
        notes?: string;
      }>;
    }>;
  }>;
};
type ExerciseOptions = Awaited<ReturnType<typeof exerciseApi.list>>["items"];

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition aria-invalid:border-rose-400 aria-invalid:ring-2 aria-invalid:ring-rose-100 focus:border-primary focus:ring-2 focus:ring-primary/15";
const numberValue = {
  setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
};
const newEntry =
  (): RoutineFormValues["days"][number]["blocks"][number]["exercises"][number] => ({
    exerciseId: "",
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    rir: 2,
    restSeconds: 90,
    notes: "",
  });
const newBlock = (): RoutineFormValues["days"][number]["blocks"][number] => ({
  name: "",
  type: "STRAIGHT_SET",
  restSeconds: undefined,
  exercises: [newEntry()],
});
const newDay = (position: number): RoutineFormValues["days"][number] => ({
  name: `Día ${position}`,
  blocks: [newBlock()],
});

function defaults(routine?: RoutineDetail): RoutineFormValues {
  const version = routine?.currentVersion;
  return {
    name: routine?.name ?? "",
    description: routine?.description ?? "",
    status: routine?.status ?? "DRAFT",
    notes: version?.notes ?? "",
    days: version?.days.map((day) => ({
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
    })) ?? [newDay(1)],
  };
}

function message(error: unknown) {
  return typeof error === "object" && error && "message" in error
    ? String((error as { message?: unknown }).message ?? "")
    : undefined;
}

function RoutineBlock({
  dayIndex,
  blockIndex,
  options,
}: {
  dayIndex: number;
  blockIndex: number;
  options: ExerciseOptions;
}) {
  const { control, register, formState } = useFormContext<RoutineFormValues>();
  const path = `days.${dayIndex}.blocks.${blockIndex}` as const;
  const entries = useFieldArray({ control, name: `${path}.exercises` });
  const error = formState.errors.days?.[dayIndex]?.blocks?.[blockIndex];

  return (
    <div className="border-purple/35 bg-lavender/15 rounded-xl border p-4">
      <div className="grid gap-3 pr-12 md:grid-cols-[10rem_minmax(12rem,1fr)_10rem]">
        <FormField
          name={`${path}.type`}
          label="Tipo de bloque"
          required
          error={error?.type?.message}
        >
          <select {...register(`${path}.type`)} className={inputClass}>
            {Object.entries(blockTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          name={`${path}.name`}
          label="Nombre del bloque"
          error={error?.name?.message}
        >
          <Input
            {...register(`${path}.name`)}
            className={inputClass}
            placeholder="Ej. Serie principal"
          />
        </FormField>
        <FormField
          name={`${path}.restSeconds`}
          label="Descanso del bloque"
          hint="0 a 900 segundos."
          error={error?.restSeconds?.message}
        >
          <Input
            {...register(`${path}.restSeconds`, numberValue)}
            className={inputClass}
            type="number"
            min="0"
            max="900"
          />
        </FormField>
      </div>
      <div className="mt-4 space-y-3">
        {entries.fields.map((entry, entryIndex) => {
          const entryPath = `${path}.exercises.${entryIndex}` as const;
          const entryError = error?.exercises?.[entryIndex];
          return (
            <div
              key={entry.id}
              className="grid gap-3 rounded-lg border border-white bg-white/90 p-3 md:grid-cols-[minmax(12rem,1fr)_5rem_6rem_6rem_5rem_6rem_auto]"
            >
              <FormField
                name={`${entryPath}.exerciseId`}
                label="Ejercicio"
                required
                error={entryError?.exerciseId?.message}
              >
                <select
                  {...register(`${entryPath}.exerciseId`)}
                  className={inputClass}
                >
                  <option value="">Selecciona un ejercicio</option>
                  {options.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                name={`${entryPath}.sets`}
                label="Series"
                required
                hint="1 a 20."
                error={entryError?.sets?.message}
              >
                <Input
                  {...register(`${entryPath}.sets`, numberValue)}
                  className={inputClass}
                  type="number"
                  min="1"
                  max="20"
                />
              </FormField>
              <FormField
                name={`${entryPath}.repsMin`}
                label="Reps mín."
                hint="1 a 100."
                error={entryError?.repsMin?.message}
              >
                <Input
                  {...register(`${entryPath}.repsMin`, numberValue)}
                  className={inputClass}
                  type="number"
                  min="1"
                  max="100"
                />
              </FormField>
              <FormField
                name={`${entryPath}.repsMax`}
                label="Reps máx."
                hint="Igual o mayor al mínimo."
                error={entryError?.repsMax?.message ?? message(entryError)}
              >
                <Input
                  {...register(`${entryPath}.repsMax`, numberValue)}
                  className={inputClass}
                  type="number"
                  min="1"
                  max="100"
                />
              </FormField>
              <FormField
                name={`${entryPath}.rir`}
                label={
                  <span className="inline-flex items-center gap-1">
                    <TermTooltip term="RIR" />
                  </span>
                }
                hint="0 a 5."
                error={entryError?.rir?.message}
              >
                <Input
                  {...register(`${entryPath}.rir`, numberValue)}
                  className={inputClass}
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                />
              </FormField>
              <FormField
                name={`${entryPath}.restSeconds`}
                label="Descanso"
                hint="0 a 900 s."
                error={entryError?.restSeconds?.message}
              >
                <Input
                  {...register(`${entryPath}.restSeconds`, numberValue)}
                  className={inputClass}
                  type="number"
                  min="0"
                  max="900"
                />
              </FormField>
              <button
                type="button"
                onClick={() => entries.remove(entryIndex)}
                disabled={entries.fields.length === 1}
                className="self-end rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                aria-label={`Eliminar ejercicio ${entryIndex + 1}`}
              >
                <Trash2 size={16} />
              </button>
              <FormField
                name={`${entryPath}.notes`}
                label="Notas del ejercicio"
                hint="Máximo 2,000 caracteres."
                error={entryError?.notes?.message}
                className="md:col-span-6"
              >
                <Input
                  {...register(`${entryPath}.notes`)}
                  className={inputClass}
                  placeholder="Técnica o indicaciones particulares."
                />
              </FormField>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => entries.append(newEntry())}
        className="text-primary mt-3 inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
      >
        <Plus size={14} /> Agregar ejercicio
      </button>
      <FormAlert message={message(error?.exercises)} />
    </div>
  );
}

function RoutineDay({
  dayIndex,
  options,
  removeDay,
  canRemove,
}: {
  dayIndex: number;
  options: ExerciseOptions;
  removeDay: () => void;
  canRemove: boolean;
}) {
  const { control, register, formState } = useFormContext<RoutineFormValues>();
  const blocks = useFieldArray({ control, name: `days.${dayIndex}.blocks` });
  const error = formState.errors.days?.[dayIndex];
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <span className="bg-primary grid size-7 place-items-center rounded-lg text-xs font-bold text-white">
          {dayIndex + 1}
        </span>
        <FormField
          name={`days.${dayIndex}.name`}
          label="Nombre del día"
          required
          hint="Entre 2 y 120 caracteres."
          error={error?.name?.message}
          className="min-w-64 flex-1"
        >
          <Input
            {...register(`days.${dayIndex}.name`)}
            className={inputClass}
            placeholder="Ej. Tren inferior"
          />
        </FormField>
        <button
          type="button"
          onClick={removeDay}
          disabled={!canRemove}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
          aria-label={`Eliminar día ${dayIndex + 1}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="space-y-4 p-5">
        {blocks.fields.map((block, blockIndex) => (
          <div key={block.id} className="relative">
            <RoutineBlock
              dayIndex={dayIndex}
              blockIndex={blockIndex}
              options={options}
            />
            <button
              type="button"
              onClick={() => blocks.remove(blockIndex)}
              disabled={blocks.fields.length === 1}
              className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
              aria-label={`Eliminar bloque ${blockIndex + 1}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => blocks.append(newBlock())}
          className="border-primary/40 text-primary hover:bg-lavender/30 inline-flex h-9 items-center gap-2 rounded-lg border border-dashed px-3 text-xs font-bold"
        >
          <Plus size={14} /> Agregar bloque
        </button>
        <FormAlert message={message(error?.blocks)} />
      </div>
    </div>
  );
}

export function RoutineBuilder({ routine }: { routine?: RoutineDetail }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineInputSchema, undefined, {
      raw: true,
    }) as Resolver<RoutineFormValues>,
    defaultValues: defaults(routine),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const days = useFieldArray({ control: form.control, name: "days" });
  const exercises = useQuery({
    queryKey: ["routine-exercise-options"],
    queryFn: () => exerciseApi.list(new URLSearchParams({ limit: "50" })),
  });
  const noExercises = exercises.isSuccess && exercises.data.items.length === 0;
  const canSave = exercises.isSuccess && exercises.data.items.length > 0;
  const isVersion = Boolean(routine);
  const mutation = useMutation({
    mutationFn: (values: RoutineFormValues) => {
      if (noExercises)
        throw new Error(
          "Crea al menos un ejercicio antes de guardar una rutina.",
        );
      if (routine) {
        const versionValues = { notes: values.notes, days: values.days };
        const parsed = routineVersionInputSchema.safeParse(versionValues);
        if (!parsed.success) throw parsed.error;
        return routineApi.addVersion(routine.id, versionValues);
      }
      return routineApi.create(values);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["routines"] });
      void queryClient.invalidateQueries({ queryKey: ["routine", saved.id] });
      toast.success(
        isVersion ? "Nueva versión creada" : "Rutina creada",
        saved.name,
      );
      router.push(`/routines/${saved.id}`);
      router.refresh();
    },
  });

  return (
    <section data-tour="routine-builder" className="mx-auto max-w-6xl">
      <Link
        href={routine ? `/routines/${routine.id}` : "/routines"}
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} /> Volver a rutinas
      </Link>
      {noExercises ? (
        <div className="mt-5">
          <EmptyState
            title="Aún no hay ejercicios disponibles"
            description="La rutina necesita al menos un ejercicio de la biblioteca."
            action={
              <Link
                href="/exercises/new"
                className="bg-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white"
              >
                Crear ejercicio
              </Link>
            }
          />
        </div>
      ) : null}
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(
            (values) =>
              mutation.mutate(values, {
                onError: (error) => {
                  const detail = applyApiError(error, form.setError);
                  toast.error("No pudimos guardar la rutina", detail);
                },
              }),
            () =>
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
              Constructor versionado
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {isVersion ? `Nueva versión · ${routine?.name}` : "Nueva rutina"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Los campos indican si son obligatorios u opcionales.
            </p>
            {!isVersion ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FormField
                  name="name"
                  label="Nombre de la plantilla"
                  required
                  hint="Entre 2 y 120 caracteres."
                  error={form.formState.errors.name?.message}
                >
                  <Input
                    {...form.register("name")}
                    className={inputClass}
                    placeholder="Ej. Hipertrofia · 4 días"
                  />
                </FormField>
                <FormField
                  name="status"
                  label="Estado inicial"
                  required
                  error={form.formState.errors.status?.message}
                >
                  <select {...form.register("status")} className={inputClass}>
                    {Object.entries(routineStatusLabel).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
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
                    placeholder="Objetivo, población o contexto de la plantilla."
                  />
                </FormField>
              </div>
            ) : null}
            <FormField
              name="notes"
              label="Notas de versión"
              hint="Máximo 2,000 caracteres."
              error={form.formState.errors.notes?.message}
              className="mt-5"
            >
              <textarea
                {...form.register("notes")}
                className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none aria-invalid:border-rose-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="Qué cambió o qué debe recordar el coach."
              />
            </FormField>
          </div>
          <div className="space-y-4">
            {days.fields.map((day, dayIndex) => (
              <RoutineDay
                key={day.id}
                dayIndex={dayIndex}
                options={exercises.data?.items ?? []}
                removeDay={() => days.remove(dayIndex)}
                canRemove={days.fields.length > 1}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => days.append(newDay(days.fields.length + 1))}
            className="border-primary/45 text-primary hover:bg-lavender/25 inline-flex h-11 items-center gap-2 rounded-xl border border-dashed bg-white px-4 text-sm font-bold"
          >
            <Plus size={17} /> Agregar día
          </button>
          <FormAlert message={message(form.formState.errors.days)} />
          <FormAlert message={form.formState.errors.root?.server?.message} />
          <div className="flex justify-end gap-3">
            <Link
              href={routine ? `/routines/${routine.id}` : "/routines"}
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Link>
            <Button type="submit" disabled={mutation.isPending || !canSave}>
              <Save size={16} />{" "}
              {mutation.isPending
                ? "Guardando…"
                : isVersion
                  ? "Crear nueva versión"
                  : "Crear rutina"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </section>
  );
}
