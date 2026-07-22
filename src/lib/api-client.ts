export type ValidationIssue = {
  path: Array<string | number>;
  message: string;
  code?: string;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code = "REQUEST_ERROR",
    public readonly issues: ValidationIssue[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: { issues?: ValidationIssue[] };
  };
  data?: unknown;
};

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json().catch(() => null)) as ErrorBody | null;

  if (!response.ok) {
    throw new ApiClientError(
      body?.error?.message ?? "No fue posible completar la solicitud.",
      body?.error?.code,
      body?.error?.details?.issues,
    );
  }

  return body?.data as T;
}
