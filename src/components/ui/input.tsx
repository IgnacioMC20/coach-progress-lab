import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "border-purple/50 focus:ring-primary/30 h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 aria-invalid:border-rose-400 aria-invalid:ring-2 aria-invalid:ring-rose-100 focus:ring-2",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
