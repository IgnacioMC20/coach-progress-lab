"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientInputSchema } from "@/features/clients/schemas/client.schema";
import { clientApi } from "@/features/clients/services/client-api";
import type {
  Client,
  ClientStatus,
  TrainingLevel,
} from "@/features/clients/types/client";

type ClientFormValues = {
  firstName: string;
  lastName: string;
  status: ClientStatus;
  email?: string;
  phone?: string;
  birthDate?: string;
  heightCm?: number;
  primaryGoal?: string;
  trainingLevel?: TrainingLevel;
  currentProgram?: string;
  currentWeek?: number;
  notes?: string;
};
const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15";
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
function asDefaultValues(client?: Client): ClientFormValues {
  return {
    firstName: client?.firstName ?? "",
    lastName: client?.lastName ?? "",
    status: client?.status ?? "ACTIVE",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    birthDate: client?.birthDate?.slice(0, 10) ?? "",
    heightCm: client?.heightCm ?? undefined,
    primaryGoal: client?.primaryGoal ?? "",
    trainingLevel: client?.trainingLevel ?? undefined,
    currentProgram: client?.currentProgram ?? "",
    currentWeek: client?.currentWeek ?? undefined,
    notes: client?.notes ?? "",
  };
}
export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientInputSchema) as Resolver<ClientFormValues>,
    defaultValues: asDefaultValues(client),
    mode: "onBlur",
  });
  const mutation = useMutation({
    mutationFn: (values: ClientFormValues) =>
      client ? clientApi.update(client.id, values) : clientApi.create(values),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      void queryClient.invalidateQueries({ queryKey: ["client", saved.id] });
      router.push(`/clients/${saved.id}`);
      router.refresh();
    },
  });
  const onSubmit = (values: ClientFormValues) =>
    mutation.mutate(values, {
      onError: (error) => form.setError("root", { message: error.message }),
    });
  const numberValue = {
    setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
  };
  return (
    <section className="mx-auto max-w-4xl">
      <Link
        href={client ? `/clients/${client.id}` : "/clients"}
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} />
        Volver a clientes
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(32,23,67,0.05)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
            Ficha de cliente
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {client ? "Editar perfil" : "Nuevo cliente"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Los campos físicos sirven para calcular la edad y el IMC desde el perfil.
          </p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nombre" error={form.formState.errors.firstName?.message}>
              <Input
                {...form.register("firstName")}
                className={inputClass}
                placeholder="Ej. Ligia"
              />
            </Field>
            <Field label="Apellido" error={form.formState.errors.lastName?.message}>
              <Input
                {...form.register("lastName")}
                className={inputClass}
                placeholder="Ej. Morales"
              />
            </Field>
            <Field
              label="Correo electrónico"
              error={form.formState.errors.email?.message}
            >
              <Input
                {...form.register("email")}
                className={inputClass}
                type="email"
                placeholder="cliente@email.com"
              />
            </Field>
            <Field label="Teléfono" error={form.formState.errors.phone?.message}>
              <Input
                {...form.register("phone")}
                className={inputClass}
                placeholder="+502 0000 0000"
              />
            </Field>
            <Field
              label="Fecha de nacimiento"
              error={form.formState.errors.birthDate?.message}
            >
              <Input {...form.register("birthDate")} className={inputClass} type="date" />
            </Field>
            <Field label="Estatura (cm)" error={form.formState.errors.heightCm?.message}>
              <Input
                {...form.register("heightCm", numberValue)}
                className={inputClass}
                type="number"
                min="80"
                max="250"
                placeholder="165"
              />
            </Field>
            <Field
              label="Objetivo principal"
              error={form.formState.errors.primaryGoal?.message}
            >
              <Input
                {...form.register("primaryGoal")}
                className={inputClass}
                placeholder="Ej. Hipertrofia"
              />
            </Field>
            <Field label="Nivel">
              <select {...form.register("trainingLevel")} className={inputClass}>
                <option value="">Seleccionar nivel</option>
                <option value="BEGINNER">Principiante</option>
                <option value="INTERMEDIATE">Intermedio</option>
                <option value="ADVANCED">Experto</option>
              </select>
            </Field>
            <Field label="Programa actual">
              <Input
                {...form.register("currentProgram")}
                className={inputClass}
                placeholder="Ej. Hipertrofia 12 semanas"
              />
            </Field>
            <Field
              label="Semana actual"
              error={form.formState.errors.currentWeek?.message}
            >
              <Input
                {...form.register("currentWeek", numberValue)}
                className={inputClass}
                type="number"
                min="1"
                max="104"
                placeholder="1"
              />
            </Field>
            <Field label="Estado">
              <select {...form.register("status")} className={inputClass}>
                <option value="ACTIVE">Activo</option>
                <option value="PAUSED">Pausado</option>
                <option value="COMPLETED">Finalizado</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </Field>
          </div>
          <Field label="Notas" error={form.formState.errors.notes?.message}>
            <textarea
              {...form.register("notes")}
              className="focus:border-primary focus:ring-primary/15 mt-1 min-h-25 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2"
              placeholder="Contexto relevante del cliente, restricciones o preferencias."
            />
          </Field>
          {form.formState.errors.root && (
            <p role="alert" className="mt-4 text-sm font-medium text-rose-600">
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Link
              href={client ? `/clients/${client.id}` : "/clients"}
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Link>
            <Button type="submit" disabled={mutation.isPending}>
              <Save size={16} />
              {mutation.isPending
                ? "Guardando..."
                : client
                  ? "Guardar cambios"
                  : "Crear cliente"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
