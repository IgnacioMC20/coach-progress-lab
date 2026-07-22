"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BedDouble,
  ClipboardCheck,
  Pencil,
  Plus,
  Scale,
  Utensils,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { clientApi } from "@/features/clients/services/client-api";
import { checkInApi } from "@/features/check-ins/services/check-in-api";
import type { CheckIn } from "@/features/check-ins/types/check-in";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
});
const fullDateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function Metric({
  icon: Icon,
  label,
  value,
  tone = "text-primary bg-lavender/40",
}: {
  icon: typeof Scale;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
      <div className={cn("grid size-9 place-items-center rounded-xl", tone)}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function TrendChart({
  title,
  detail,
  data,
  dataKey,
  color,
  suffix,
}: {
  title: string;
  detail: string;
  data: CheckIn[];
  dataKey: "weightKg" | "sleepHours" | "nutritionAdherence";
  color: string;
  suffix: string;
}) {
  const chartData = data.map((checkIn) => ({
    date: dateFormatter.format(new Date(checkIn.checkInDate)),
    value: checkIn[dataKey],
  }));
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">
          {data.length} semanas
        </span>
      </div>
      <div
        className="mt-4 h-48"
        role="img"
        aria-label={`Tendencia de ${title}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            title={`Tendencia de ${title}`}
            margin={{ left: -18, right: 6 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#e7e9f0"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              width={38}
            />
            <Tooltip
              formatter={(value) =>
                value === null ? "—" : `${value}${suffix}`
              }
              contentStyle={{
                borderRadius: 12,
                borderColor: "#e2e8f0",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 2, fill: "white" }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function CheckInCard({
  checkIn,
  onRemove,
}: {
  checkIn: CheckIn;
  onRemove: () => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(32,23,67,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold tracking-tight text-slate-900">
            {checkIn.clientName}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {fullDateFormatter.format(new Date(checkIn.checkInDate))}
          </p>
        </div>
        <div className="flex gap-1">
          <Link
            href={`/check-ins/${checkIn.id}/edit`}
            className="text-primary rounded-lg p-2 hover:bg-violet-50"
            aria-label="Editar check-in"
          >
            <Pencil size={15} />
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
            aria-label="Eliminar check-in"
          >
            ×
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 px-2 py-2.5 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Peso</p>
          <p className="mt-0.5 text-sm font-bold">
            {checkIn.weightKg ?? "—"} {checkIn.weightKg ? "kg" : ""}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Sueño</p>
          <p className="mt-0.5 text-sm font-bold">
            {checkIn.sleepHours ?? "—"} {checkIn.sleepHours ? "h" : ""}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Adherencia</p>
          <p className="mt-0.5 text-sm font-bold">
            {checkIn.nutritionAdherence === null
              ? "—"
              : `${checkIn.nutritionAdherence}%`}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
        {checkIn.energyLevel !== null && (
          <span className="bg-lavender/45 text-primary rounded-full px-2 py-1">
            Energía {checkIn.energyLevel}/5
          </span>
        )}
        {checkIn.steps !== null && (
          <span className="bg-blue/35 rounded-full px-2 py-1 text-slate-700">
            {checkIn.steps.toLocaleString("es")} pasos
          </span>
        )}
      </div>
      {checkIn.notes && (
        <p className="mt-3 text-xs leading-5 text-slate-500">{checkIn.notes}</p>
      )}
    </article>
  );
}

export function CheckInsLibrary() {
  const [clientId, setClientId] = useState("");
  const queryClient = useQueryClient();
  const toast = useToast();
  const clients = useQuery({
    queryKey: ["check-in-clients"],
    queryFn: () =>
      clientApi.list(new URLSearchParams({ limit: "50", status: "ACTIVE" })),
  });
  const params = useMemo(() => {
    const value = new URLSearchParams({ limit: "20" });
    if (clientId) value.set("clientId", clientId);
    return value;
  }, [clientId]);
  const checkIns = useQuery({
    queryKey: ["check-ins", params.toString()],
    queryFn: () => checkInApi.list(params),
  });
  const remove = useMutation({
    mutationFn: (id: string) => checkInApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["check-ins"] });
      toast.success("Check-in eliminado");
    },
    onError: (error) =>
      toast.error("No pudimos eliminar el check-in", error.message),
  });
  const selectedClient = clients.data?.items.find(
    (client) => client.id === clientId,
  );
  const noClients = clients.isSuccess && clients.data.items.length === 0;
  return (
    <section className="mx-auto max-w-7xl">
      <div
        data-tour="check-ins-overview"
        className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p className="text-primary mb-1 text-xs font-bold tracking-[0.18em] uppercase">
            Seguimiento semanal
          </p>
          <h1 className="font-display text-4xl font-bold tracking-[-0.055em] text-slate-900">
            Check-ins
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Convierte las señales de la semana en decisiones de coaching claras.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className="focus:ring-primary/20 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm outline-none sm:min-w-56 sm:w-auto focus:ring-2"
          >
            <option value="">Todos los clientes</option>
            {clients.data?.items.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName}
              </option>
            ))}
          </select>
          <Link
            href="/check-ins/new"
            className={cn(
              buttonVariants(),
              "gap-2 shadow-[0_8px_18px_rgba(91,75,183,0.25)]",
            )}
          >
            <Plus size={17} />
            Nuevo check-in
          </Link>
        </div>
      </div>

      {checkIns.data && (
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={Scale}
            label="Último peso"
            value={
              checkIns.data.summary.latestWeightKg === null
                ? "Sin registro"
                : `${checkIns.data.summary.latestWeightKg} kg`
            }
          />
          <Metric
            icon={BedDouble}
            label="Sueño promedio"
            value={
              checkIns.data.summary.averageSleepHours === null
                ? "Sin registro"
                : `${checkIns.data.summary.averageSleepHours} h`
            }
            tone="bg-blue/35 text-primary"
          />
          <Metric
            icon={Utensils}
            label="Adherencia promedio"
            value={
              checkIns.data.summary.averageNutritionAdherence === null
                ? "Sin registro"
                : `${checkIns.data.summary.averageNutritionAdherence}%`
            }
            tone="bg-pink/45 text-fuchsia-700"
          />
          <Metric
            icon={Activity}
            label="Energía promedio"
            value={
              checkIns.data.summary.averageEnergyLevel === null
                ? "Sin registro"
                : `${checkIns.data.summary.averageEnergyLevel}/5`
            }
            tone="bg-emerald-50 text-emerald-700"
          />
        </div>
      )}

      {clientId && checkIns.data?.trend.length ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          <TrendChart
            title="Peso"
            detail={
              selectedClient ? selectedClient.fullName : "Historial del cliente"
            }
            data={checkIns.data.trend}
            dataKey="weightKg"
            color="#5B4BB7"
            suffix=" kg"
          />
          <TrendChart
            title="Sueño"
            detail="Horas promedio reportadas"
            data={checkIns.data.trend}
            dataKey="sleepHours"
            color="#6478e8"
            suffix=" h"
          />
          <TrendChart
            title="Adherencia nutricional"
            detail="Porcentaje reportado"
            data={checkIns.data.trend}
            dataKey="nutritionAdherence"
            color="#d946a7"
            suffix="%"
          />
        </div>
      ) : noClients ? (
        <div className="mt-6">
          <EmptyState
            title="Aún no hay clientes"
            description="Crea un perfil antes de registrar y comparar check-ins."
            action={
              <Link
                href="/clients/new"
                className={cn(buttonVariants(), "gap-2")}
              >
                Crear cliente
              </Link>
            }
          />
        </div>
      ) : (
        <div className="border-lavender/70 bg-lavender/15 mt-6 flex items-center gap-3 rounded-2xl border p-4 text-sm text-slate-600">
          <ClipboardCheck className="text-primary" size={20} />
          Selecciona un cliente para consultar sus tendencias semanales.
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Registros recientes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Medidas, hábitos y contexto semanal.
          </p>
        </div>
        {checkIns.data && (
          <span className="text-primary rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold">
            {checkIns.data.total} registros
          </span>
        )}
      </div>
      <div className="mt-4">
        {checkIns.isPending ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl border bg-white"
              />
            ))}
          </div>
        ) : checkIns.isError ? (
          <EmptyState
            title="No pudimos cargar los check-ins"
            description="Actualiza la página e inténtalo de nuevo."
          />
        ) : checkIns.data?.items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {checkIns.data.items.map((checkIn) => (
              <CheckInCard
                key={checkIn.id}
                checkIn={checkIn}
                onRemove={() => {
                  if (
                    window.confirm(
                      `¿Eliminar el check-in de ${checkIn.clientName}?`,
                    )
                  )
                    remove.mutate(checkIn.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <EmptyState
              title="No hay check-ins todavía"
              description={
                noClients
                  ? "Crea un perfil de cliente para empezar el seguimiento semanal."
                  : "Registra el primer seguimiento semanal para empezar a ver tendencias."
              }
              action={
                noClients ? (
                  <Link
                    href="/clients/new"
                    className={cn(buttonVariants(), "gap-2")}
                  >
                    Crear cliente
                  </Link>
                ) : undefined
              }
            />
            <div className="flex justify-center">
              <Link
                href="/check-ins/new"
                className={cn(buttonVariants(), "gap-2")}
              >
                <Plus size={16} />
                Nuevo check-in
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
