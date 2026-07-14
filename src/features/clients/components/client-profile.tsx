"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardPlus,
  Pencil,
  Ruler,
  Scale,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { assessmentInputSchema } from "@/features/clients/schemas/client.schema";
import {
  levelLabel,
  statusLabel,
  statusTone,
} from "@/features/clients/client-labels";
import { clientApi } from "@/features/clients/services/client-api";
import type { ClientAssessment } from "@/features/clients/types/client";
import { cn } from "@/lib/utils";

type AssessmentFormValues = {
  assessedAt?: string;
  weightKg?: number;
  bodyFatPercentage?: number;
  waistCm?: number;
  notes?: string;
};
const numberValue = {
  setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
};
function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Scale;
  label: ReactNode;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <Icon className="text-primary mb-2" size={19} />
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold tracking-tight">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}
function AssessmentForm({
  clientId,
  assessment,
  onFinished,
}: {
  clientId: string;
  assessment: ClientAssessment | null;
  onFinished: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(
      assessmentInputSchema,
    ) as Resolver<AssessmentFormValues>,
    defaultValues: assessment
      ? {
          assessedAt: assessment.assessedAt.slice(0, 10),
          weightKg: assessment.weightKg ?? undefined,
          bodyFatPercentage: assessment.bodyFatPercentage ?? undefined,
          waistCm: assessment.waistCm ?? undefined,
          notes: assessment.notes ?? "",
        }
      : { assessedAt: new Date().toISOString().slice(0, 10) },
  });
  const mutation = useMutation({
    mutationFn: (values: AssessmentFormValues) =>
      assessment
        ? clientApi.updateAssessment(clientId, assessment.id, values)
        : clientApi.addAssessment(clientId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      onFinished();
    },
  });
  return (
    <form
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate(values, {
          onError: (error) => form.setError("root", { message: error.message }),
        }),
      )}
      className="mt-4 grid gap-3 rounded-xl border border-violet-100 bg-violet-50/45 p-4 md:grid-cols-4"
    >
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        Fecha
        <input
          type="date"
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          {...form.register("assessedAt")}
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        Peso (kg)
        <input
          type="number"
          step="0.1"
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          {...form.register("weightKg", numberValue)}
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        Grasa corporal (%)
        <input
          type="number"
          step="0.1"
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          {...form.register("bodyFatPercentage", numberValue)}
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        Cintura (cm)
        <input
          type="number"
          step="0.1"
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          {...form.register("waistCm", numberValue)}
        />
      </label>
      <label className="md:col-span-3">
        <span className="sr-only">Observaciones</span>
        <input
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          placeholder="Observaciones de la evaluación"
          {...form.register("notes")}
        />
      </label>
      <Button type="submit" size="sm" disabled={mutation.isPending}>
        <ClipboardPlus size={15} />
        {mutation.isPending
          ? "Guardando"
          : assessment
            ? "Guardar evaluación"
            : "Registrar"}
      </Button>
      {form.formState.errors.root && (
        <p role="alert" className="text-sm text-rose-600 md:col-span-4">
          {form.formState.errors.root.message}
        </p>
      )}
    </form>
  );
}
export function ClientProfile() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedAssessment, setSelectedAssessment] =
    useState<ClientAssessment | null>(null);
  const deletion = useMutation({
    mutationFn: () => clientApi.remove(clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push("/clients");
      router.refresh();
    },
  });
  const {
    data: client,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => clientApi.get(clientId),
    enabled: Boolean(clientId),
  });
  if (isPending)
    return <div className="h-120 animate-pulse rounded-2xl border bg-white" />;
  if (isError || !client)
    return (
      <EmptyState
        title="No encontramos este cliente"
        description="Puede haber sido eliminado o la dirección no es correcta."
      />
    );
  const assessment = client.latestAssessment;
  return (
    <section className="mx-auto max-w-6xl">
      <Link
        href="/clients"
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={16} />
        Clientes
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(32,23,67,0.045)] sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="from-pink via-lavender to-blue text-primary grid size-16 place-items-center rounded-full bg-gradient-to-br text-lg font-bold">
              {client.firstName[0]}
              {client.lastName[0]}
            </div>
            <div>
              <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                Perfil de cliente
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                {client.fullName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {client.primaryGoal ?? "Objetivo pendiente"} ·{" "}
                {client.trainingLevel
                  ? levelLabel[client.trainingLevel]
                  : "Nivel pendiente"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold",
                statusTone[client.status],
              )}
            >
              {statusLabel[client.status]}
            </span>
            <Link
              href={`/clients/${client.id}/edit`}
              className="border-primary/40 text-primary inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-bold hover:bg-violet-50"
            >
              <Pencil size={15} />
              Editar
            </Link>
            <button
              type="button"
              disabled={deletion.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `¿Eliminar a ${client.fullName}? Esta acción no se puede deshacer.`,
                  )
                ) {
                  deletion.mutate();
                }
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              aria-label={`Eliminar a ${client.fullName}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={Scale}
            label="Peso actual"
            value={
              assessment?.weightKg
                ? `${assessment.weightKg} kg`
                : "Sin registro"
            }
            detail={assessment ? "Última evaluación" : undefined}
          />
          <Metric
            icon={Ruler}
            label={
              <span className="inline-flex items-center gap-1">
                Estatura / <TermTooltip term="IMC" />
              </span>
            }
            value={
              client.heightCm
                ? `${client.heightCm} cm · ${client.bmi ?? "—"}`
                : "Sin registro"
            }
            detail="Índice calculado"
          />
          <Metric
            icon={UserRound}
            label="Edad"
            value={client.age ? `${client.age} años` : "Sin registro"}
            detail={
              client.birthDate
                ? new Intl.DateTimeFormat("es", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(client.birthDate))
                : undefined
            }
          />
          <Metric
            icon={CalendarDays}
            label="Programa"
            value={
              client.currentWeek
                ? `Semana ${client.currentWeek}`
                : "Sin asignar"
            }
            detail={client.currentProgram ?? undefined}
          />
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(32,23,67,0.035)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">Historial de evaluaciones</h2>
              <p className="mt-1 text-sm text-slate-500">
                Registra los datos físicos para tener un historial consistente.
              </p>
            </div>
            <span className="text-primary rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold">
              {client.assessments.length} registros
            </span>
          </div>
          <AssessmentForm
            key={selectedAssessment?.id ?? "new"}
            clientId={client.id}
            assessment={selectedAssessment}
            onFinished={() => setSelectedAssessment(null)}
          />
          <div className="mt-5 divide-y divide-slate-100">
            {client.assessments.length ? (
              client.assessments.map((item) => (
                <div
                  className="grid grid-cols-2 gap-3 py-3 text-sm sm:grid-cols-4"
                  key={item.id}
                >
                  <div>
                    <p className="text-xs text-slate-500">Fecha</p>
                    <p className="font-semibold">
                      {new Intl.DateTimeFormat("es", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(item.assessedAt))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Peso</p>
                    <p className="font-semibold">
                      {item.weightKg ? `${item.weightKg} kg` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Grasa corporal</p>
                    <p className="font-semibold">
                      {item.bodyFatPercentage
                        ? `${item.bodyFatPercentage}%`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Cintura</p>
                    <p className="font-semibold">
                      {item.waistCm ? `${item.waistCm} cm` : "—"}
                    </p>
                  </div>
                  {item.notes && (
                    <p className="col-span-full text-xs text-slate-500">
                      {item.notes}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedAssessment(item)}
                    className="text-primary col-span-full justify-self-start text-xs font-bold hover:underline"
                  >
                    Editar evaluación
                  </button>
                </div>
              ))
            ) : (
              <p className="py-7 text-center text-sm text-slate-500">
                Aún no hay evaluaciones.
              </p>
            )}
          </div>
        </section>
        <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(32,23,67,0.035)]">
          <h2 className="font-bold">Datos y contexto</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Correo</dt>
              <dd className="text-right font-medium">{client.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Teléfono</dt>
              <dd className="text-right font-medium">{client.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Programa</dt>
              <dd className="text-right font-medium">
                {client.currentProgram ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Nivel</dt>
              <dd className="text-right font-medium">
                {client.trainingLevel ? levelLabel[client.trainingLevel] : "—"}
              </dd>
            </div>
          </dl>
          {client.notes && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase">
                Notas
              </p>
              <p className="mt-1 text-sm leading-6">{client.notes}</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
