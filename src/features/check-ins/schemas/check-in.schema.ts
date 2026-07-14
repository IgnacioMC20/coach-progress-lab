import { z } from "zod";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";

const optionalText = z
  .string()
  .trim()
  .max(2_000)
  .optional()
  .transform((value) => value || undefined);
const optionalNumber = (min: number, max: number) =>
  z
    .union([z.coerce.number().finite().min(min).max(max), z.literal("")])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value));
const optionalInteger = (min: number, max: number) =>
  z
    .union([z.coerce.number().int().min(min).max(max), z.literal("")])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value));
const checkInDateSchema = z
  .string()
  .date()
  .transform((value) => new Date(`${value}T12:00:00.000Z`));

const checkInContentSchema = z.object({
  checkInDate: checkInDateSchema,
  weightKg: optionalNumber(20, 400),
  chestCm: optionalNumber(30, 250),
  waistCm: optionalNumber(30, 250),
  hipCm: optionalNumber(30, 250),
  sleepHours: optionalNumber(0, 24),
  steps: optionalInteger(0, 100_000),
  energyLevel: optionalInteger(1, 5),
  hungerLevel: optionalInteger(1, 5),
  nutritionAdherence: optionalInteger(0, 100),
  notes: optionalText,
});

export const checkInInputSchema = checkInContentSchema.extend({
  clientId: objectIdSchema,
});
export const checkInUpdateSchema = checkInContentSchema.partial();
export const listCheckInsQuerySchema = z.object({
  clientId: objectIdSchema.optional(),
  from: z
    .string()
    .date()
    .optional()
    .transform((value) => (value ? new Date(`${value}T00:00:00.000Z`) : undefined)),
  to: z
    .string()
    .date()
    .optional()
    .transform((value) => (value ? new Date(`${value}T23:59:59.999Z`) : undefined)),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CheckInInput = z.infer<typeof checkInInputSchema>;
export type CheckInUpdate = z.infer<typeof checkInUpdateSchema>;
