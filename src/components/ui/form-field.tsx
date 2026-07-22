import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function FormField({
  name,
  label,
  required = false,
  hint,
  error,
  children,
  className,
}: {
  name: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactElement<FieldControlProps>;
  className?: string;
}) {
  const fieldId = `field-${name.replaceAll(".", "-")}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? fieldId,
        "aria-describedby": describedBy,
        "aria-invalid": Boolean(error),
      })
    : children;

  return (
    <label
      htmlFor={fieldId}
      className={cn(
        "grid gap-1.5 text-sm font-semibold text-slate-700",
        className,
      )}
    >
      <span className="flex flex-wrap items-center gap-2">
        <span>{label}</span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wide uppercase",
            required
              ? "bg-primary/10 text-primary"
              : "bg-slate-100 text-slate-500",
          )}
        >
          {required ? "Obligatorio" : "Opcional"}
        </span>
      </span>
      {hint ? (
        <span
          id={hintId}
          className="text-xs leading-5 font-normal text-slate-500"
        >
          {hint}
        </span>
      ) : null}
      {control}
      {error ? (
        <span
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs leading-5 font-semibold text-rose-600"
        >
          <AlertCircle
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
