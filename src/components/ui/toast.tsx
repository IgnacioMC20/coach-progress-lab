"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";
type Toast = {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
};
type ToastApi = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id = ++nextId.current;
      setToasts((current) => [
        ...current.slice(-3),
        { id, variant, title, description },
      ]);
      const duration = variant === "error" ? 7_000 : 4_500;
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) clearTimeout(timer);
    },
    [],
  );

  const value = useMemo<ToastApi>(
    () => ({
      success: (title, description) => show("success", title, description),
      error: (title, description) => show("error", title, description),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-96"
        aria-label="Notificaciones"
      >
        {toasts.map((toast) => {
          return (
            <div
              key={toast.id}
              role={toast.variant === "error" ? "alert" : "status"}
              aria-live={toast.variant === "error" ? "assertive" : "polite"}
              className={cn(
                "pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-white p-4 shadow-[0_18px_45px_rgba(32,23,67,0.16)]",
                toast.variant === "success"
                  ? "border-emerald-200"
                  : "border-rose-200",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {toast.title}
                </p>
                {toast.description ? (
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                aria-label="Cerrar notificación"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast debe usarse dentro de ToastProvider");
  return value;
}
