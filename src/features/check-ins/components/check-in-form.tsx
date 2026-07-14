"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientApi } from "@/features/clients/services/client-api";
import {
  checkInInputSchema,
  checkInUpdateSchema,
} from "@/features/check-ins/schemas/check-in.schema";
import { checkInApi } from "@/features/check-ins/services/check-in-api";
import type { CheckIn } from "@/features/check-ins/types/check-in";

type CheckInFormValues = {
  clientId: string;
  checkInDate: string;
  weightKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  sleepHours?: number;
  steps?: number;
  energyLevel?: number;
  hungerLevel?: number;
  nutritionAdherence?: number;
  notes?: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15";
const numberValue = {
  setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
};
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function CheckInForm({ checkIn }: { checkIn?: CheckIn }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<CheckInFormValues>({
    defaultValues: checkIn
      ? {
          clientId: checkIn.clientId,
          checkInDate: checkIn.checkInDate.slice(0, 10),
          weightKg: checkIn.weightKg ?? undefined,
          chestCm: checkIn.chestCm ?? undefined,
          waistCm: checkIn.waistCm ?? undefined,
          hipCm: checkIn.hipCm ?? undefined,
          sleepHours: checkIn.sleepHours ?? undefined,
          steps: checkIn.steps ?? undefined,
          energyLevel: checkIn.energyLevel ?? undefined,
          hungerLevel: checkIn.hungerLevel ?? undefined,
          nutritionAdherence: checkIn.nutritionAdherence ?? undefined,
          notes: checkIn.notes ?? "",
        }
      : { clientId: "", checkInDate: new Date().toISOString().slice(0, 10) },
  });
  const clients = useQuery({
    queryKey: ["check-in-form-clients"],
    queryFn: () => clientApi.list(new URLSearchParams({ limit: "50", status: "ACTIVE" })),
  });
  const mutation = useMutation({
    mutationFn: (values: CheckInFormValues) => {
      const parsed = checkIn
        ? checkInUpdateSchema.safeParse(values)
        : checkInInputSchema.safeParse(values);
      if (!parsed.success)
        throw new Error(
          parsed.error.issues[0]?.message ?? "Revisa los datos del check-in",
        );
      return checkIn
        ? checkInApi.update(checkIn.id, parsed.data)
        : checkInApi.create(parsed.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["check-ins"] });
      router.push("/check-ins");
      router.refresh();
    },
  });
  return (
    <section className="mx-auto max-w-5xl">
      <Link
        href="/check-ins"
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} />
        Volver a check-ins
      </Link>
      <form
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate(values, {
            onError: (error) => form.setError("root", { message: error.message }),
          }),
        )}
        className="mt-5 space-y-5"
      >
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
          <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
            Seguimiento semanal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {checkIn ? "Editar check-in" : "Nuevo check-in"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Registra medidas, recuperación y adherencia de la última semana.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Cliente">
              <select
                {...form.register("clientId")}
                disabled={Boolean(checkIn)}
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
            <Field label="Fecha del check-in">
              <Input
                {...form.register("checkInDate")}
                className={inputClass}
                type="date"
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
            <h2 className="text-lg font-bold">Peso y medidas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Todos los campos son opcionales.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Peso (kg)">
                <Input
                  {...form.register("weightKg", numberValue)}
                  type="number"
                  step="0.1"
                  min="20"
                />
              </Field>
              <Field label="Pecho (cm)">
                <Input
                  {...form.register("chestCm", numberValue)}
                  type="number"
                  step="0.1"
                />
              </Field>
              <Field label="Cintura (cm)">
                <Input
                  {...form.register("waistCm", numberValue)}
                  type="number"
                  step="0.1"
                />
              </Field>
              <Field label="Cadera (cm)">
                <Input
                  {...form.register("hipCm", numberValue)}
                  type="number"
                  step="0.1"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
            <h2 className="text-lg font-bold">Hábitos y sensaciones</h2>
            <p className="mt-1 text-sm text-slate-500">
              Escalas de 1 a 5, salvo adherencia.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Sueño (horas)">
                <Input
                  {...form.register("sleepHours", numberValue)}
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                />
              </Field>
              <Field label="Pasos diarios promedio">
                <Input
                  {...form.register("steps", numberValue)}
                  type="number"
                  min="0"
                  step="100"
                />
              </Field>
              <Field label="Energía (1–5)">
                <Input
                  {...form.register("energyLevel", numberValue)}
                  type="number"
                  min="1"
                  max="5"
                />
              </Field>
              <Field label="Hambre (1–5)">
                <Input
                  {...form.register("hungerLevel", numberValue)}
                  type="number"
                  min="1"
                  max="5"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Adherencia nutricional (%)">
                  <Input
                    {...form.register("nutritionAdherence", numberValue)}
                    type="number"
                    min="0"
                    max="100"
                  />
                </Field>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
          <Field label="Observaciones">
            <textarea
              {...form.register("notes")}
              className="focus:border-primary focus:ring-primary/15 min-h-28 rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2"
              placeholder="Cambios, dificultades, molestias o contexto relevante de la semana."
            />
          </Field>
        </section>
        {form.formState.errors.root && (
          <p role="alert" className="text-sm font-medium text-rose-600">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Link
            href="/check-ins"
            className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={mutation.isPending}>
            <Save size={16} />
            {mutation.isPending ? "Guardando…" : "Guardar check-in"}
          </Button>
        </div>
      </form>
    </section>
  );
}
