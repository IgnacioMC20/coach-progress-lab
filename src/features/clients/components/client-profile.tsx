"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ClipboardPlus,
  Dumbbell,
  Pencil,
  Pause,
  PlayCircle,
  Ruler,
  Scale,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/shared/empty-state";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { assessmentFormSchema } from "@/features/clients/schemas/client.schema";
import { circuitAssignmentStatusLabel } from "@/features/circuits/circuit-labels";
import { circuitApi } from "@/features/circuits/services/circuit-api";
import {
  levelLabel,
  statusLabel,
  statusTone,
} from "@/features/clients/client-labels";
import { clientApi } from "@/features/clients/services/client-api";
import type {
  ClientAssessment,
  ClientDetail,
} from "@/features/clients/types/client";
import { assignmentStatusLabel } from "@/features/routines/routine-labels";
import { routineApi } from "@/features/routines/services/routine-api";
import { cn } from "@/lib/utils";
import { applyApiError } from "@/lib/form-errors";

type AssessmentFormValues = {
  assessedAt?: string;
  weightKg?: number;
  bodyFatPercentage?: number;
  waistCm?: number;
  notes?: string;
};
function clientInitials(firstName: string, lastName: string) {
  const initials = `${firstName?.trim().charAt(0) ?? ""}${lastName?.trim().charAt(0) ?? ""}`;
  return initials.toUpperCase() || "?";
}
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
  const toast = useToast();
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema, undefined, {
      raw: true,
    }) as Resolver<AssessmentFormValues>,
    defaultValues: assessment
      ? {
          assessedAt: assessment.assessedAt.slice(0, 10),
          weightKg: assessment.weightKg ?? undefined,
          bodyFatPercentage: assessment.bodyFatPercentage ?? undefined,
          waistCm: assessment.waistCm ?? undefined,
          notes: assessment.notes ?? "",
        }
      : { assessedAt: new Date().toISOString().slice(0, 10) },
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const mutation = useMutation({
    mutationFn: (values: AssessmentFormValues) =>
      assessment
        ? clientApi.updateAssessment(clientId, assessment.id, values)
        : clientApi.addAssessment(clientId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(
        assessment ? "Evaluación actualizada" : "Evaluación registrada",
      );
      onFinished();
    },
  });
  return (
    <form
      onSubmit={form.handleSubmit(
        (values) =>
          mutation.mutate(values, {
            onError: (error) => {
              const message = applyApiError(error, form.setError);
              toast.error("No pudimos guardar la evaluación", message);
            },
          }),
        () =>
          toast.error(
            "Revisa los campos marcados",
            "Corrige los errores antes de guardar.",
          ),
      )}
      className="mt-4 grid gap-3 rounded-xl border border-violet-100 bg-violet-50/45 p-4 md:grid-cols-4"
      noValidate
    >
      <FormField
        name="assessedAt"
        label="Fecha"
        error={form.formState.errors.assessedAt?.message}
      >
        <input
          type="date"
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          {...form.register("assessedAt")}
        />
      </FormField>
      <FormField
        name="weightKg"
        label="Peso (kg)"
        hint="Entre 20 y 400 kg."
        error={form.formState.errors.weightKg?.message}
      >
        <input
          type="number"
          step="0.1"
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          {...form.register("weightKg", numberValue)}
        />
      </FormField>
      <FormField
        name="bodyFatPercentage"
        label="Grasa corporal (%)"
        hint="Entre 1 y 80%."
        error={form.formState.errors.bodyFatPercentage?.message}
      >
        <input
          type="number"
          step="0.1"
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          {...form.register("bodyFatPercentage", numberValue)}
        />
      </FormField>
      <FormField
        name="waistCm"
        label="Cintura (cm)"
        error={form.formState.errors.waistCm?.message}
      >
        <input
          type="number"
          step="0.1"
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          {...form.register("waistCm", numberValue)}
        />
      </FormField>
      <FormField
        name="notes"
        label="Observaciones"
        hint="Máximo 2,000 caracteres."
        error={form.formState.errors.notes?.message}
        className="md:col-span-3"
      >
        <input
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          placeholder="Observaciones de la evaluación"
          {...form.register("notes")}
        />
      </FormField>
      <Button type="submit" size="sm" disabled={mutation.isPending}>
        <ClipboardPlus size={15} />
        {mutation.isPending
          ? "Guardando"
          : assessment
            ? "Guardar evaluación"
            : "Registrar"}
      </Button>
      <div className="md:col-span-4">
        <FormAlert message={form.formState.errors.root?.server?.message} />
      </div>
    </form>
  );
}

function ClientProgramming({ client }: { client: ClientDetail }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [routineId, setRoutineId] = useState("");
  const [routineVersionId, setRoutineVersionId] = useState("");
  const [circuitId, setCircuitId] = useState("");
  const [circuitVersionId, setCircuitVersionId] = useState("");
  const routines = useQuery({
    queryKey: ["client-routine-options"],
    queryFn: () => routineApi.list(new URLSearchParams({ limit: "50" })),
  });
  const circuits = useQuery({
    queryKey: ["client-circuit-options"],
    queryFn: () => circuitApi.list(new URLSearchParams({ limit: "50" })),
  });
  const selectedRoutine = useQuery({
    queryKey: ["routine", routineId],
    queryFn: () => routineApi.get(routineId),
    enabled: Boolean(routineId),
  });
  const selectedCircuit = useQuery({
    queryKey: ["circuit", circuitId],
    queryFn: () => circuitApi.get(circuitId),
    enabled: Boolean(circuitId),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["client", client.id] });
    void queryClient.invalidateQueries({ queryKey: ["clients"] });
    void queryClient.invalidateQueries({ queryKey: ["routines"] });
    void queryClient.invalidateQueries({ queryKey: ["circuits"] });
  };
  const assignRoutine = useMutation({
    mutationFn: () =>
      routineApi.assign(routineId, {
        clientId: client.id,
        routineVersionId:
          routineVersionId || selectedRoutine.data?.currentVersion?.id,
      }),
    onSuccess: () => {
      setRoutineId("");
      setRoutineVersionId("");
      refresh();
      toast.success(
        "Rutina asignada",
        `La rutina se asignó a ${client.fullName}.`,
      );
    },
    onError: (error) =>
      toast.error("No pudimos asignar la rutina", error.message),
  });
  const assignCircuit = useMutation({
    mutationFn: () =>
      circuitApi.assign(circuitId, {
        clientId: client.id,
        circuitVersionId:
          circuitVersionId || selectedCircuit.data?.currentVersion?.id,
      }),
    onSuccess: () => {
      setCircuitId("");
      setCircuitVersionId("");
      refresh();
      toast.success(
        "Circuito asignado",
        `El circuito se asignó a ${client.fullName}.`,
      );
    },
    onError: (error) =>
      toast.error("No pudimos asignar el circuito", error.message),
  });
  const updateRoutine = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "PAUSED" | "COMPLETED";
    }) => routineApi.updateAssignment(id, { status }),
    onSuccess: () => {
      refresh();
      toast.success("Estado de rutina actualizado");
    },
    onError: (error) =>
      toast.error("No pudimos actualizar la rutina", error.message),
  });
  const updateCircuit = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "PAUSED" | "COMPLETED";
    }) => circuitApi.updateAssignment(id, { status }),
    onSuccess: () => {
      refresh();
      toast.success("Estado de circuito actualizado");
    },
    onError: (error) =>
      toast.error("No pudimos actualizar el circuito", error.message),
  });
  const activeRoutines =
    routines.data?.items.filter((item) => item.status !== "ARCHIVED") ?? [];
  const activeCircuits =
    circuits.data?.items.filter((item) => item.status !== "ARCHIVED") ?? [];
  return (
    <section
      data-tour="client-programming"
      className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(32,23,67,0.035)]"
    >
      <div>
        <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
          Programación
        </p>
        <h2 className="mt-1 text-xl font-bold">
          Rutinas y circuitos asignados
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          La rutina nueva finaliza la anterior. Los circuitos pueden acompañarla
          de forma independiente.
        </p>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="border-purple/35 bg-lavender/15 rounded-xl border p-4">
          <div className="text-primary flex items-center gap-2">
            <Dumbbell size={18} />
            <h3 className="font-bold">Asignar rutina</h3>
          </div>
          <div className="mt-4 grid gap-3">
            {routines.isSuccess && activeRoutines.length === 0 && (
              <p className="rounded-lg border border-dashed border-purple/40 bg-white/70 p-3 text-xs leading-5 text-slate-600">
                No hay rutinas asignables todavía.{" "}
                <Link
                  href="/routines/new"
                  className="text-primary font-bold hover:underline"
                >
                  Crear una rutina
                </Link>
              </p>
            )}
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Rutina
              <select
                value={routineId}
                onChange={(event) => {
                  setRoutineId(event.target.value);
                  setRoutineVersionId("");
                }}
                disabled={activeRoutines.length === 0}
                className="h-10 rounded-lg border border-purple/40 bg-white px-3 text-sm"
              >
                <option value="">Seleccionar rutina</option>
                {activeRoutines.map((routine) => (
                  <option key={routine.id} value={routine.id}>
                    {routine.name}
                  </option>
                ))}
              </select>
            </label>
            {routineId && (
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Versión
                <select
                  value={
                    routineVersionId ||
                    selectedRoutine.data?.currentVersion?.id ||
                    ""
                  }
                  onChange={(event) => setRoutineVersionId(event.target.value)}
                  className="h-10 rounded-lg border border-purple/40 bg-white px-3 text-sm"
                  disabled={selectedRoutine.isPending}
                >
                  {selectedRoutine.data?.versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      Versión {version.version}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Button
              type="button"
              onClick={() => assignRoutine.mutate()}
              disabled={
                !routineId ||
                !selectedRoutine.data?.currentVersion ||
                assignRoutine.isPending
              }
            >
              <Dumbbell size={16} />{" "}
              {assignRoutine.isPending ? "Asignando…" : "Asignar rutina"}
            </Button>
            {assignRoutine.error && (
              <p role="alert" className="text-xs font-medium text-rose-600">
                {assignRoutine.error.message}
              </p>
            )}
          </div>
        </div>
        <div className="border-blue/45 bg-blue/15 rounded-xl border p-4">
          <div className="text-primary flex items-center gap-2">
            <Activity size={18} />
            <h3 className="font-bold">Asignar circuito</h3>
          </div>
          <div className="mt-4 grid gap-3">
            {circuits.isSuccess && activeCircuits.length === 0 && (
              <p className="rounded-lg border border-dashed border-blue/45 bg-white/70 p-3 text-xs leading-5 text-slate-600">
                No hay circuitos asignables todavía.{" "}
                <Link
                  href="/circuits/new"
                  className="text-primary font-bold hover:underline"
                >
                  Crear un circuito
                </Link>
              </p>
            )}
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Circuito
              <select
                value={circuitId}
                onChange={(event) => {
                  setCircuitId(event.target.value);
                  setCircuitVersionId("");
                }}
                disabled={activeCircuits.length === 0}
                className="h-10 rounded-lg border border-blue/45 bg-white px-3 text-sm"
              >
                <option value="">Seleccionar circuito</option>
                {activeCircuits.map((circuit) => (
                  <option key={circuit.id} value={circuit.id}>
                    {circuit.name}
                  </option>
                ))}
              </select>
            </label>
            {circuitId && (
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Versión
                <select
                  value={
                    circuitVersionId ||
                    selectedCircuit.data?.currentVersion?.id ||
                    ""
                  }
                  onChange={(event) => setCircuitVersionId(event.target.value)}
                  className="h-10 rounded-lg border border-blue/45 bg-white px-3 text-sm"
                  disabled={selectedCircuit.isPending}
                >
                  {selectedCircuit.data?.versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      Versión {version.version}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => assignCircuit.mutate()}
              disabled={
                !circuitId ||
                !selectedCircuit.data?.currentVersion ||
                assignCircuit.isPending
              }
            >
              <Activity size={16} />{" "}
              {assignCircuit.isPending ? "Asignando…" : "Asignar circuito"}
            </Button>
            {assignCircuit.error && (
              <p role="alert" className="text-xs font-medium text-rose-600">
                {assignCircuit.error.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AssignmentHistory
          title="Historial de rutinas"
          empty="Todavía no hay rutinas asignadas."
          icon={<Dumbbell size={17} />}
        >
          {client.routineAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              name={assignment.routineName}
              version={assignment.version}
              statusLabel={assignmentStatusLabel[assignment.status]}
              status={assignment.status}
              startDate={assignment.startDate}
              onPause={() =>
                updateRoutine.mutate({ id: assignment.id, status: "PAUSED" })
              }
              onComplete={() =>
                updateRoutine.mutate({ id: assignment.id, status: "COMPLETED" })
              }
            />
          ))}
        </AssignmentHistory>
        <AssignmentHistory
          title="Historial de circuitos"
          empty="Todavía no hay circuitos asignados."
          icon={<Activity size={17} />}
        >
          {client.circuitAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              name={assignment.circuitName}
              version={assignment.version}
              statusLabel={circuitAssignmentStatusLabel[assignment.status]}
              status={assignment.status}
              startDate={assignment.startDate}
              onPause={() =>
                updateCircuit.mutate({ id: assignment.id, status: "PAUSED" })
              }
              onComplete={() =>
                updateCircuit.mutate({ id: assignment.id, status: "COMPLETED" })
              }
            />
          ))}
        </AssignmentHistory>
      </div>
    </section>
  );
}

function AssignmentHistory({
  title,
  empty,
  icon,
  children,
}: {
  title: string;
  empty: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/55 p-4">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="mt-3 space-y-2">
        {hasChildren ? (
          children
        ) : (
          <p className="py-3 text-sm text-slate-500">{empty}</p>
        )}
      </div>
    </div>
  );
}

function AssignmentCard({
  name,
  version,
  status,
  statusLabel,
  startDate,
  onPause,
  onComplete,
}: {
  name: string;
  version: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  statusLabel: string;
  startDate: string;
  onPause: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="rounded-lg border border-white bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            v{version} · {statusLabel} ·{" "}
            {new Intl.DateTimeFormat("es", {
              day: "numeric",
              month: "short",
            }).format(new Date(startDate))}
          </p>
        </div>
        {status === "ACTIVE" && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onPause}
              className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
              aria-label={`Pausar ${name}`}
            >
              <Pause size={14} />
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
              aria-label={`Finalizar ${name}`}
            >
              <PlayCircle size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export function ClientProfile() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedAssessment, setSelectedAssessment] =
    useState<ClientAssessment | null>(null);
  const deletion = useMutation({
    mutationFn: () => clientApi.remove(clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente eliminado");
      router.push("/clients");
      router.refresh();
    },
    onError: (error) =>
      toast.error("No pudimos eliminar el cliente", error.message),
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
              {clientInitials(client.firstName, client.lastName)}
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
      <ClientProgramming client={client} />
    </section>
  );
}
