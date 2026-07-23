import { z } from "zod";

const MONGODB_PROTOCOLS = new Set(["mongodb:", "mongodb+srv:"]);

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function usesMongoProtocol(value: string) {
  const url = parseUrl(value);
  return url !== null && MONGODB_PROTOCOLS.has(url.protocol);
}

function hasDatabaseName(value: string) {
  const url = parseUrl(value);
  if (!url) return false;

  try {
    const databaseName = decodeURIComponent(url.pathname.slice(1)).trim();
    return databaseName.length > 0 && !databaseName.includes("/");
  } catch {
    return false;
  }
}

export const mongodbUrlSchema = z
  .string()
  .url()
  .refine(usesMongoProtocol, {
    message: "DATABASE_URL must use mongodb:// or mongodb+srv://",
  })
  .refine(hasDatabaseName, {
    message:
      "DATABASE_URL must include a database name, for example /coach_progress",
  });
