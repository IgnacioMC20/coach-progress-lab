"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/shared/empty-state";
import { clientApi } from "@/features/clients/services/client-api";
import { checkInInputSchema } from "@/features/check-ins/schemas/check-in.schema";
import { checkInApi } from "@/features/check-ins/services/check-in-api";
import type { CheckIn } from "@/features/check-ins/types/check-in";
import { applyApiError } from "@/lib/form-errors";

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
export function CheckInForm({ checkIn }: { checkIn?: CheckIn }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const form = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInInputSchema, undefined, {
      raw: true,
    }) as Resolver<CheckInFormValues>,
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
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const clients = useQuery({
    queryKey: ["check-in-form-clients"],
    queryFn: () =>
      clientApi.list(new URLSearchParams({ limit: "50", status: "ACTIVE" })),
  });
  const noClients = clients.isSuccess && clients.data.items.length === 0;
  const canSave =
    Boolean(checkIn) || (clients.isSuccess && clients.data.items.length > 0);
  const mutation = useMutation({
    mutationFn: (values: CheckInFormValues) => {
      if (!checkIn && noClients)
        throw new Error(
          "Crea al menos un cliente antes de registrar un check-in.",
        );
      return checkIn
        ? checkInApi.update(checkIn.id, values)
        : checkInApi.create(values);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["check-ins"] });
      toast.success(checkIn ? "Check-in actualizado" : "Check-in guardado");
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
      {!checkIn && noClients && (
        <EmptyState
          title="Aún no hay clientes disponibles"
          description="Crea un perfil de cliente antes de registrar un check-in."
          action={
            <Link
              href="/clients/new"
              className="bg-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              Crear cliente
            </Link>
          }
        />
      )}
      <form
        onSubmit={form.handleSubmit(
          (values) =>
            mutation.mutate(values, {
              onError: (error) => {
                const message = applyApiError(error, form.setError);
                toast.error("No pudimos guardar el check-in", message);
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
            Seguimiento semanal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {checkIn ? "Editar check-in" : "Nuevo check-in"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Registra medidas, recuperación y adherencia de la última semana.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Los campos indican si son obligatorios u opcionales.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormField
              name="clientId"
              label="Cliente"
              required
              error={form.formState.errors.clientId?.message}
            >
              <select
                {...form.register("clientId")}
                disabled={Boolean(checkIn) || noClients}
                className={inputClass}
              >
                <option value="">Seleccionar cliente</option>
                {clients.data?.items.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              name="checkInDate"
              label="Fecha del check-in"
              required
              error={form.formState.errors.checkInDate?.message}
            >
              <Input
                {...form.register("checkInDate")}
                className={inputClass}
                type="date"
              />
            </FormField>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
            <h2 className="text-lg font-bold">Peso y medidas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Todos los campos son opcionales.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField
                name="weightKg"
                label="Peso (kg)"
                hint="Entre 20 y 400 kg."
                error={form.formState.errors.weightKg?.message}
              >
                <Input
                  {...form.register("weightKg", numberValue)}
                  type="number"
                  step="0.1"
                  min="20"
                />
              </FormField>
              <FormField
                name="chestCm"
                label="Pecho (cm)"
                hint="Entre 30 y 250 cm."
                error={form.formState.errors.chestCm?.message}
              >
                <Input
                  {...form.register("chestCm", numberValue)}
                  type="number"
                  step="0.1"
                />
              </FormField>
              <FormField
                name="waistCm"
                label="Cintura (cm)"
                hint="Entre 30 y 250 cm."
                error={form.formState.errors.waistCm?.message}
              >
                <Input
                  {...form.register("waistCm", numberValue)}
                  type="number"
                  step="0.1"
                />
              </FormField>
              <FormField
                name="hipCm"
                label="Cadera (cm)"
                hint="Entre 30 y 250 cm."
                error={form.formState.errors.hipCm?.message}
              >
                <Input
                  {...form.register("hipCm", numberValue)}
                  type="number"
                  step="0.1"
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
            <h2 className="text-lg font-bold">Hábitos y sensaciones</h2>
            <p className="mt-1 text-sm text-slate-500">
              Escalas de 1 a 5, salvo adherencia.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField
                name="sleepHours"
                label="Sueño (horas)"
                hint="Entre 0 y 24 horas."
                error={form.formState.errors.sleepHours?.message}
              >
                <Input
                  {...form.register("sleepHours", numberValue)}
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                />
              </FormField>
              <FormField
                name="steps"
                label="Pasos diarios promedio"
                hint="Número entero entre 0 y 100,000."
                error={form.formState.errors.steps?.message}
              >
                <Input
                  {...form.register("steps", numberValue)}
                  type="number"
                  min="0"
                  step="100"
                />
              </FormField>
              <FormField
                name="energyLevel"
                label="Energía (1–5)"
                hint="Escala entera del 1 al 5."
                error={form.formState.errors.energyLevel?.message}
              >
                <Input
                  {...form.register("energyLevel", numberValue)}
                  type="number"
                  min="1"
                  max="5"
                />
              </FormField>
              <FormField
                name="hungerLevel"
                label="Hambre (1–5)"
                hint="Escala entera del 1 al 5."
                error={form.formState.errors.hungerLevel?.message}
              >
                <Input
                  {...form.register("hungerLevel", numberValue)}
                  type="number"
                  min="1"
                  max="5"
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField
                  name="nutritionAdherence"
                  label="Adherencia nutricional (%)"
                  hint="Número entero entre 0 y 100."
                  error={form.formState.errors.nutritionAdherence?.message}
                >
                  <Input
                    {...form.register("nutritionAdherence", numberValue)}
                    type="number"
                    min="0"
                    max="100"
                  />
                </FormField>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
          <FormField
            name="notes"
            label="Observaciones"
            hint="Máximo 2,000 caracteres."
            error={form.formState.errors.notes?.message}
          >
            <textarea
              {...form.register("notes")}
              className="focus:border-primary focus:ring-primary/15 min-h-28 rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2"
              placeholder="Cambios, dificultades, molestias o contexto relevante de la semana."
            />
          </FormField>
        </section>
        <FormAlert message={form.formState.errors.root?.server?.message} />
        <div className="flex justify-end gap-3">
          <Link
            href="/check-ins"
            className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={mutation.isPending || !canSave}>
            <Save size={16} />
            {mutation.isPending ? "Guardando…" : "Guardar check-in"}
          </Button>
        </div>
      </form>
    </section>
  );
}
