import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiClientError } from "@/lib/api-client";

export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  const message =
    error instanceof Error ? error.message : "No pudimos guardar los cambios.";

  if (error instanceof ApiClientError && error.issues.length > 0) {
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (path)
        setError(path as Path<T>, { type: "server", message: issue.message });
    }
  }

  setError("root.server" as Path<T>, { type: "server", message });
  return message;
}
