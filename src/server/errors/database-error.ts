const DATABASE_CONNECTION_ERROR_PATTERNS = [
  "p1001",
  "server selection timeout",
  "no available servers",
  "replicasetnoprimary",
  "replica set no primary",
  "received fatal alert",
  "tls",
  "ssl",
  "kind: i/o error",
  "connection timed out",
] as const;

function errorText(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? ` ${error.cause.message}` : "";
    return `${error.name} ${error.message}${cause}`.toLowerCase();
  }
  return String(error).toLowerCase();
}

export function isDatabaseConnectionError(error: unknown): boolean {
  const text = errorText(error);
  return DATABASE_CONNECTION_ERROR_PATTERNS.some((pattern) =>
    text.includes(pattern),
  );
}
