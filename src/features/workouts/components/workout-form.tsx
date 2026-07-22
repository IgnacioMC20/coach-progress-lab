"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { clientApi } from "@/features/clients/services/client-api";
import { exerciseApi } from "@/features/exercises/services/exercise-api";
import {
  techniqueLabel,
  workoutStatusLabel,
} from "@/features/workouts/workout-labels";
import { workoutApi } from "@/features/workouts/services/workout-api";
import { workoutInputSchema } from "@/features/workouts/schemas/workout.schema";
import type {
  TechniqueStatus,
  WorkoutSession,
  WorkoutSessionStatus,
} from "@/features/workouts/types/workout";
import { applyApiError } from "@/lib/form-errors";

type WorkoutFormValues = {
  clientId: string;
  performedAt: string;
  status: WorkoutSessionStatus;
  notes?: string;
  exercises: Array<{
    exerciseId: string;
    notes?: string;
    sets: Array<{
      weightKg?: number;
      reps?: number;
      durationSeconds?: number;
      rir?: number;
      technique?: TechniqueStatus;
      painLevel?: number;
      notes?: string;
    }>;
  }>;
};
type ExerciseOptions = Awaited<ReturnType<typeof exerciseApi.list>>["items"];

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition aria-invalid:border-rose-400 aria-invalid:ring-2 aria-invalid:ring-rose-100 focus:border-primary focus:ring-2 focus:ring-primary/15";
const numberValue = {
  setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
};
const newSet = (): WorkoutFormValues["exercises"][number]["sets"][number] => ({
  weightKg: undefined,
  reps: 10,
  durationSeconds: undefined,
  rir: 2,
  technique: "GOOD",
  painLevel: 0,
  notes: "",
});
const newExercise = (): WorkoutFormValues["exercises"][number] => ({
  exerciseId: "",
  notes: "",
  sets: [newSet()],
});
const today = () => new Date().toISOString().slice(0, 10);

function defaults(
  workout: WorkoutSession | undefined,
  clientId: string,
): WorkoutFormValues {
  return {
    clientId: workout?.clientId ?? clientId,
    performedAt: workout?.performedAt.slice(0, 10) ?? today(),
    status: workout?.status ?? "IN_PROGRESS",
    notes: workout?.notes ?? "",
    exercises: workout?.exercises.map((exercise) => ({
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
    })) ?? [newExercise()],
  };
}

function message(error: unknown) {
  return typeof error === "object" && error && "message" in error
    ? String((error as { message?: unknown }).message ?? "")
    : undefined;
}

function WorkoutExercise({
  index,
  options,
  remove,
  canRemove,
}: {
  index: number;
  options: ExerciseOptions;
  remove: () => void;
  canRemove: boolean;
}) {
  const { control, register, formState } = useFormContext<WorkoutFormValues>();
  const sets = useFieldArray({ control, name: `exercises.${index}.sets` });
  const error = formState.errors.exercises?.[index];
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
      <div className="flex items-end gap-3">
        <FormField
          name={`exercises.${index}.exerciseId`}
          label={`Ejercicio ${index + 1}`}
          required
          error={error?.exerciseId?.message}
          className="flex-1"
        >
          <select
            {...register(`exercises.${index}.exerciseId`)}
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
        <button
          type="button"
          onClick={remove}
          disabled={!canRemove}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
          aria-label={`Eliminar ejercicio ${index + 1}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <FormField
        name={`exercises.${index}.notes`}
        label="Notas del ejercicio"
        hint="Máximo 2,000 caracteres."
        error={error?.notes?.message}
        className="mt-4"
      >
        <Input
          {...register(`exercises.${index}.notes`)}
          className={inputClass}
          placeholder="Técnica o contexto general del ejercicio."
        />
      </FormField>
      <div className="mt-4 space-y-3">
        {sets.fields.map((set, setIndex) => {
          const path = `exercises.${index}.sets.${setIndex}` as const;
          const setError = error?.sets?.[setIndex];
          return (
            <div
              key={set.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-800">
                  Serie {setIndex + 1}
                </p>
                <button
                  type="button"
                  onClick={() => sets.remove(setIndex)}
                  disabled={sets.fields.length === 1}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                  aria-label={`Eliminar serie ${setIndex + 1}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  name={`${path}.weightKg`}
                  label="Peso (kg)"
                  hint="0 a 1,000 kg."
                  error={setError?.weightKg?.message}
                >
                  <Input
                    {...register(`${path}.weightKg`, numberValue)}
                    className={inputClass}
                    type="number"
                    min="0"
                    max="1000"
                    step="0.5"
                  />
                </FormField>
                <FormField
                  name={`${path}.reps`}
                  label="Repeticiones"
                  hint="0 a 500."
                  error={setError?.reps?.message}
                >
                  <Input
                    {...register(`${path}.reps`, numberValue)}
                    className={inputClass}
                    type="number"
                    min="0"
                    max="500"
                  />
                </FormField>
                <FormField
                  name={`${path}.durationSeconds`}
                  label="Duración (segundos)"
                  hint="0 a 86,400."
                  error={setError?.durationSeconds?.message}
                >
                  <Input
                    {...register(`${path}.durationSeconds`, numberValue)}
                    className={inputClass}
                    type="number"
                    min="0"
                    max="86400"
                  />
                </FormField>
                <FormField
                  name={`${path}.rir`}
                  label={
                    <span className="inline-flex items-center gap-1">
                      <TermTooltip term="RIR" />
                    </span>
                  }
                  hint="0 a 5."
                  error={setError?.rir?.message}
                >
                  <Input
                    {...register(`${path}.rir`, numberValue)}
                    className={inputClass}
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                  />
                </FormField>
                <FormField
                  name={`${path}.technique`}
                  label="Técnica"
                  error={setError?.technique?.message}
                >
                  <select
                    {...register(`${path}.technique`)}
                    className={inputClass}
                  >
                    <option value="">Sin evaluar</option>
                    {Object.entries(techniqueLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  name={`${path}.painLevel`}
                  label="Dolor"
                  hint="Escala entera de 0 a 10."
                  error={setError?.painLevel?.message}
                >
                  <Input
                    {...register(`${path}.painLevel`, numberValue)}
                    className={inputClass}
                    type="number"
                    min="0"
                    max="10"
                  />
                </FormField>
                <FormField
                  name={`${path}.notes`}
                  label="Nota de serie"
                  hint="Máximo 2,000 caracteres."
                  error={setError?.notes?.message}
                  className="sm:col-span-2"
                >
                  <Input
                    {...register(`${path}.notes`)}
                    className={inputClass}
                    placeholder="Ajustes, sensaciones o incidencias."
                  />
                </FormField>
              </div>
              {message(setError) ? (
                <div className="mt-3">
                  <FormAlert message={message(setError)} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => sets.append(newSet())}
        className="text-primary mt-3 inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
      >
        <Plus size={14} /> Agregar serie
      </button>
      <FormAlert message={message(error?.sets)} />
    </article>
  );
}

export function WorkoutForm({ workout }: { workout?: WorkoutSession }) {
  const router = useRouter();
  const search = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutInputSchema, undefined, {
      raw: true,
    }) as Resolver<WorkoutFormValues>,
    defaultValues: defaults(workout, search.get("clientId") ?? ""),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const exercises = useFieldArray({ control: form.control, name: "exercises" });
  const clients = useQuery({
    queryKey: ["workout-form-clients"],
    queryFn: () =>
      clientApi.list(new URLSearchParams({ limit: "50", status: "ACTIVE" })),
  });
  const exerciseOptions = useQuery({
    queryKey: ["workout-form-exercises"],
    queryFn: () => exerciseApi.list(new URLSearchParams({ limit: "50" })),
  });
  const noClients = clients.isSuccess && clients.data.items.length === 0;
  const noExercises =
    exerciseOptions.isSuccess && exerciseOptions.data.items.length === 0;
  const dependenciesReady =
    exerciseOptions.isSuccess &&
    exerciseOptions.data.items.length > 0 &&
    (Boolean(workout) || (clients.isSuccess && clients.data.items.length > 0));
  const mutation = useMutation({
    mutationFn: (values: WorkoutFormValues) => {
      if (!workout && noClients)
        throw new Error(
          "Crea al menos un cliente antes de registrar sesiones.",
        );
      if (noExercises)
        throw new Error(
          "Crea al menos un ejercicio antes de registrar sesiones.",
        );
      return workout
        ? workoutApi.update(workout.id, values)
        : workoutApi.create(values);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["workouts"] });
      void queryClient.invalidateQueries({ queryKey: ["workout", saved.id] });
      toast.success(
        workout ? "Sesión actualizada" : "Sesión registrada",
        saved.clientName,
      );
      router.push(`/workouts/${saved.id}`);
      router.refresh();
    },
  });

  return (
    <section className="mx-auto max-w-6xl">
      <Link
        href={workout ? `/workouts/${workout.id}` : "/workouts"}
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} /> Volver a entrenamientos
      </Link>
      {!workout && noClients ? (
        <EmptyState
          title="Aún no hay clientes disponibles"
          description="Crea un perfil de cliente antes de registrar una sesión."
          action={
            <Link
              href="/clients/new"
              className="bg-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white"
            >
              Crear cliente
            </Link>
          }
        />
      ) : null}
      {!workout && noExercises ? (
        <div className="mt-4">
          <EmptyState
            title="Aún no hay ejercicios disponibles"
            description="Crea el primer ejercicio para poder componer una sesión."
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
                  toast.error("No pudimos guardar la sesión", detail);
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
              Registro de sesión
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {workout ? "Editar entrenamiento" : "Nuevo entrenamiento"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Los campos indican si son obligatorios u opcionales.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <FormField
                name="clientId"
                label="Cliente"
                required
                error={form.formState.errors.clientId?.message}
              >
                <select
                  {...form.register("clientId")}
                  disabled={Boolean(workout) || noClients}
                  className={inputClass}
                >
                  <option value="">Selecciona un cliente</option>
                  {clients.data?.items.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                name="performedAt"
                label="Fecha"
                required
                error={form.formState.errors.performedAt?.message}
              >
                <Input
                  {...form.register("performedAt")}
                  className={inputClass}
                  type="date"
                />
              </FormField>
              <FormField
                name="status"
                label="Estado"
                required
                error={form.formState.errors.status?.message}
              >
                <select {...form.register("status")} className={inputClass}>
                  {Object.entries(workoutStatusLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                name="notes"
                label="Observaciones de sesión"
                hint="Máximo 2,000 caracteres."
                error={form.formState.errors.notes?.message}
                className="md:col-span-3"
              >
                <textarea
                  {...form.register("notes")}
                  className="min-h-22 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none aria-invalid:border-rose-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="Energía general, contexto o notas relevantes."
                />
              </FormField>
            </div>
          </div>
          <div className="space-y-4">
            {exercises.fields.map((exercise, index) => (
              <WorkoutExercise
                key={exercise.id}
                index={index}
                options={exerciseOptions.data?.items ?? []}
                remove={() => exercises.remove(index)}
                canRemove={exercises.fields.length > 1}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => exercises.append(newExercise())}
            className="border-primary/45 text-primary hover:bg-lavender/25 inline-flex h-11 items-center gap-2 rounded-xl border border-dashed bg-white px-4 text-sm font-bold"
          >
            <Plus size={17} /> Agregar ejercicio
          </button>
          <FormAlert message={message(form.formState.errors.exercises)} />
          <FormAlert message={form.formState.errors.root?.server?.message} />
          <div className="flex justify-end gap-3">
            <Link
              href={workout ? `/workouts/${workout.id}` : "/workouts"}
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Link>
            <Button
              type="submit"
              disabled={mutation.isPending || !dependenciesReady}
            >
              <Save size={16} />{" "}
              {mutation.isPending
                ? "Guardando…"
                : workout
                  ? "Guardar sesión"
                  : "Registrar sesión"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </section>
  );
}
