"use client";

import { usePathname, useRouter } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { clientApi } from "@/features/clients/services/client-api";
import type { DriveStep, Driver } from "driver.js";
import { onboardingApi } from "@/features/onboarding/services/onboarding-api";

type TourStep = DriveStep & { route: string; section: string };

export function createTourSteps(clientId?: string): readonly TourStep[] {
  return [
    {
      route: "/dashboard",
      section: "Inicio",
      popover: {
        title: "Bienvenida, Cielo",
        description:
          "Este recorrido conecta las áreas que usarás para acompañar a tus clientes, desde la ficha inicial hasta las decisiones de progresión.",
      },
    },
    {
      route: "/dashboard",
      section: "Inicio",
      element: '[data-tour="dashboard-overview"]',
      popover: {
        title: "Tu punto de partida diario",
        description:
          "El dashboard resume los últimos 7 días y prioriza clientes que necesitan seguimiento, avances destacados y actividad reciente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/clients",
      section: "Clientes",
      element: '[data-tour="clients-overview"]',
      popover: {
        title: "Crea el perfil del cliente",
        description:
          "Empieza aquí. Registra su objetivo, nivel, contexto y evaluaciones para que el resto del seguimiento tenga una base clara.",
        side: "bottom",
        align: "start",
      },
    },
    ...(clientId
      ? [
          {
            route: `/clients/${clientId}`,
            section: "Programación",
            element: '[data-tour="client-programming"]',
            popover: {
              title: "Asigna la programación",
              description:
                "Desde el perfil eliges una versión de rutina y circuitos complementarios. El historial queda disponible para pausar o finalizar cada asignación.",
              side: "top" as const,
              align: "start" as const,
            },
          },
        ]
      : []),
    {
      route: "/exercises",
      section: "Biblioteca",
      element: '[data-tour="exercises-overview"]',
      popover: {
        title: "Prepara la biblioteca",
        description:
          "Define cómo se mide cada ejercicio, su política de progresión y las sustituciones aprobadas antes de construir la programación.",
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/routines",
      section: "Rutinas",
      element: '[data-tour="routines-overview"]',
      popover: {
        title: "Diseña y versiona rutinas",
        description:
          "Crea plantillas por días y bloques. Las versiones conservan el historial cuando la programación cambia.",
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/routines/new",
      section: "Rutinas",
      element: '[data-tour="routine-builder"]',
      popover: {
        title: "Prescribe con claridad",
        description:
          "El constructor etiqueta cada campo: día, bloque, ejercicio, series, repeticiones, RIR y descansos. Así cada indicación es fácil de revisar antes de guardar.",
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/circuits",
      section: "Circuitos",
      element: '[data-tour="circuits-overview"]',
      popover: {
        title: "Crea circuitos reutilizables",
        description:
          "Los circuitos viven en su propia biblioteca, con versiones que preservan lo que cada cliente recibió.",
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/circuits/new",
      section: "Circuitos",
      element: '[data-tour="circuit-builder"]',
      popover: {
        title: "Define rondas y prescripción",
        description:
          "Configura rondas, descanso y la secuencia de ejercicios con repeticiones, carga objetivo o duración.",
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/workouts",
      section: "Ejecución",
      element: '[data-tour="workouts-overview"]',
      popover: {
        title: "Registra la ejecución real",
        description:
          "En cada sesión puedes capturar carga, repeticiones, RIR, técnica, dolor y observaciones por serie.",
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/workouts",
      section: "Ejecución",
      element: '[data-tour="workouts-history"]',
      popover: {
        title: "Revisa la semana",
        description:
          "Navega entre semanas para comprobar sesiones completadas, series y volumen registrado.",
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/check-ins",
      section: "Seguimiento",
      element: '[data-tour="check-ins-overview"]',
      popover: {
        title: "Completa el seguimiento",
        description:
          "Los check-ins reúnen medidas, sueño, energía, hambre y adherencia para interpretar el rendimiento con contexto.",
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/progression",
      section: "Progresión",
      element: '[data-tour="progression-overview"]',
      popover: {
        title: "Decide con señales de progreso",
        description:
          "Selecciona un cliente para revisar volumen, e1RM estimado, récords, alertas y sugerencias antes de ajustar su rutina.",
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/dashboard",
      section: "Inicio",
      element: '[data-tour="tour-help"]',
      popover: {
        title: "Repite el recorrido cuando quieras",
        description:
          "Este botón de ayuda siempre reinicia la guía completa desde el dashboard. Ya puedes empezar con tu primer cliente.",
        side: "bottom",
        align: "end",
      },
    },
  ];
}

function waitForElement(selector?: DriveStep["element"], timeoutMs = 5_000) {
  if (typeof selector !== "string" || document.querySelector(selector))
    return Promise.resolve();

  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timeout);
      observer.disconnect();
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) finish();
    });
    const timeout = window.setTimeout(finish, timeoutMs);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

export function OnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();
  const driverRef = useRef<Driver | null>(null);
  const pendingStepRef = useRef<number | null>(null);
  const runIdRef = useRef(0);
  const seenMarkedRef = useRef(false);
  const autoStartedRef = useRef(false);
  const statusRequestRef = useRef<ReturnType<
    typeof onboardingApi.getStatus
  > | null>(null);
  const stepsRef = useRef<readonly TourStep[]>(createTourSteps());

  const finishTour = useCallback((currentDriver: Driver) => {
    pendingStepRef.current = null;
    runIdRef.current += 1;
    if (!seenMarkedRef.current) {
      seenMarkedRef.current = true;
      void onboardingApi.markSeen().catch(() => undefined);
    }
    currentDriver.destroy();
    if (driverRef.current === currentDriver) driverRef.current = null;
  }, []);

  const moveToStep = useCallback(
    (currentIndex: number, offset: -1 | 1, currentDriver: Driver) => {
      const targetIndex = currentIndex + offset;
      const target = stepsRef.current[targetIndex];
      if (!target) return finishTour(currentDriver);

      if (window.location.pathname === target.route) {
        currentDriver.moveTo(targetIndex);
        return;
      }

      pendingStepRef.current = targetIndex;
      currentDriver.destroy();
      if (driverRef.current === currentDriver) driverRef.current = null;
      router.push(target.route);
    },
    [finishTour, router],
  );

  const createAndDrive = useCallback(
    async (stepIndex: number, runId: number) => {
      const step = stepsRef.current[stepIndex];
      if (!step || window.location.pathname !== step.route) return;

      await waitForElement(step.element);
      const { driver } = await import("driver.js");
      if (
        runIdRef.current !== runId ||
        pendingStepRef.current !== stepIndex ||
        window.location.pathname !== step.route
      )
        return;

      const driverObj = driver({
        steps: stepsRef.current.map(({ element, popover, section }) => ({
          element,
          popover,
          data: { section },
        })),
        animate: true,
        duration: 350,
        smoothScroll: true,
        allowClose: true,
        allowScroll: true,
        overlayClickBehavior: "close",
        overlayColor: "#201743",
        overlayOpacity: 0.58,
        stagePadding: 10,
        stageRadius: 16,
        popoverOffset: 12,
        disableActiveInteraction: true,
        popoverClass: "cpl-tour-popover",
        showProgress: true,
        progressText: "Paso {{current}} de {{total}}",
        nextBtnText: "Siguiente",
        prevBtnText: "Anterior",
        doneBtnText: "Finalizar",
        onPopoverRender: (popover, options) => {
          popover.closeButton.setAttribute("aria-label", "Cerrar recorrido");
          const index = options.index ?? 0;
          const section = stepsRef.current[index]?.section;
          if (
            section &&
            !popover.title.parentElement?.querySelector(".cpl-tour-kicker")
          ) {
            const kicker = document.createElement("span");
            kicker.className = "cpl-tour-kicker";
            kicker.textContent = section;
            popover.title.before(kicker);
          }
        },
        onNextClick: (_element, _step, options) =>
          moveToStep(options.index ?? 0, 1, options.driver),
        onPrevClick: (_element, _step, options) =>
          moveToStep(options.index ?? 0, -1, options.driver),
        onCloseClick: (_element, _step, options) => finishTour(options.driver),
        onDoneClick: (_element, _step, options) => finishTour(options.driver),
        onDestroyStarted: (_element, _step, options) =>
          finishTour(options.driver),
        onDestroyed: (_element, _step, options) => {
          if (driverRef.current === options.driver) driverRef.current = null;
        },
      });

      driverRef.current?.destroy();
      driverRef.current = driverObj;
      pendingStepRef.current = null;
      driverObj.drive(stepIndex);
    },
    [finishTour, moveToStep],
  );

  const startTour = useCallback(async () => {
    autoStartedRef.current = true;
    seenMarkedRef.current = false;
    runIdRef.current += 1;
    const runId = runIdRef.current;
    const client = await clientApi
      .list(new URLSearchParams({ status: "ACTIVE", limit: "1" }))
      .then((result) => result.items[0] ?? null)
      .catch(() => null);
    stepsRef.current = createTourSteps(client?.id);
    pendingStepRef.current = 0;
    driverRef.current?.destroy();
    driverRef.current = null;

    if (window.location.pathname === stepsRef.current[0]?.route) {
      void createAndDrive(0, runId);
      return;
    }
    router.push(stepsRef.current[0]?.route ?? "/dashboard");
  }, [createAndDrive, router]);

  useEffect(() => {
    const pendingStep = pendingStepRef.current;
    if (
      pendingStep === null ||
      stepsRef.current[pendingStep]?.route !== pathname
    )
      return;
    void createAndDrive(pendingStep, runIdRef.current);
  }, [createAndDrive, pathname]);

  useEffect(() => {
    statusRequestRef.current ??= onboardingApi.getStatus();
    let cancelled = false;
    void statusRequestRef.current
      .then((status) => {
        if (!cancelled && !status.seen && !autoStartedRef.current)
          void startTour();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [startTour]);

  useEffect(
    () => () => {
      runIdRef.current += 1;
      pendingStepRef.current = null;
      driverRef.current?.destroy();
      driverRef.current = null;
    },
    [],
  );

  return (
    <button
      type="button"
      onClick={() => void startTour()}
      data-tour="tour-help"
      aria-label="Iniciar recorrido guiado"
      className="group hover:text-primary focus-visible:ring-primary/25 relative grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-violet-50 focus-visible:ring-2 focus-visible:outline-none"
    >
      <CircleHelp size={19} />
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-20 mt-2 w-max rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        Recorrido guiado
      </span>
    </button>
  );
}
