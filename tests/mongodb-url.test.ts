import { describe, expect, it } from "vitest";
import { mongodbUrlSchema } from "@/lib/mongodb-url";

describe("MongoDB connection URL", () => {
  it.each([
    "mongodb://localhost:27017/coach_progress?replicaSet=rs0",
    "mongodb+srv://coach:secret@example.mongodb.net/coach_progress?retryWrites=true&w=majority",
  ])("accepts a MongoDB URL with a database name", (value) => {
    expect(mongodbUrlSchema.parse(value)).toBe(value);
  });

  it.each([
    "mongodb+srv://coach:secret@example.mongodb.net",
    "mongodb+srv://coach:secret@example.mongodb.net/?retryWrites=true&w=majority",
    "https://example.com/coach_progress",
  ])("rejects an invalid MongoDB database URL", (value) => {
    expect(mongodbUrlSchema.safeParse(value).success).toBe(false);
  });
});
