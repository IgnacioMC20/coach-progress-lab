"use client";

import { CircleHelp } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const definitions = {
  e1RM: "Estimación del máximo para una repetición, calculada con carga y repeticiones registradas.",
  PR: "Récord personal: la mejor marca registrada para ese ejercicio.",
  RIR: "Repeticiones en reserva: cuántas repeticiones más podrías realizar antes del fallo.",
  IMC: "Índice de masa corporal: relación entre peso y estatura usada como referencia general.",
} as const;

const TOOLTIP_WIDTH = 224;
const VIEWPORT_GUTTER = 12;

export type GlossaryTerm = keyof typeof definitions;

type TooltipPosition = {
  left: number;
  top: number;
  placement: "above" | "below";
  maxWidth: number;
};

export function TermTooltip({
  term,
  className,
}: {
  term: GlossaryTerm;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const maxWidth = Math.min(
        TOOLTIP_WIDTH,
        window.innerWidth - VIEWPORT_GUTTER * 2,
      );
      const left = Math.min(
        Math.max(rect.left + rect.width / 2, maxWidth / 2 + VIEWPORT_GUTTER),
        window.innerWidth - maxWidth / 2 - VIEWPORT_GUTTER,
      );
      const placement = rect.top > 88 ? "above" : "below";
      setPosition({
        left,
        top: placement === "above" ? rect.top - 8 : rect.bottom + 8,
        placement,
        maxWidth,
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span>{term}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Definición de ${term}`}
        aria-describedby={open ? descriptionId : undefined}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.currentTarget.blur();
          }
        }}
        className="text-primary/70 hover:text-primary focus-visible:ring-primary/30 inline-flex shrink-0 rounded-full outline-none focus-visible:ring-2"
      >
        <CircleHelp size={13} strokeWidth={2} aria-hidden="true" />
      </button>
      {open &&
        position &&
        createPortal(
          <span
            id={descriptionId}
            role="tooltip"
            style={{
              left: position.left,
              top: position.top,
              maxWidth: position.maxWidth,
            }}
            className={cn(
              "pointer-events-none fixed z-50 w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-[11px] leading-4 font-medium text-white shadow-lg",
              position.placement === "above" ? "-translate-y-full" : "",
            )}
          >
            {definitions[term]}
          </span>,
          document.body,
        )}
    </span>
  );
}
