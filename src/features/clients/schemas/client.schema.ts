import { z } from "zod";

export const clientStatusSchema = z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]);
export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");
export const trainingLevelSchema = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => value || undefined);
const optionalNumber = z.coerce.number().finite().optional();

export const clientInputSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  status: clientStatusSchema.default("ACTIVE"),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  phone: optionalText,
  birthDate: z
    .string()
    .date()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? new Date(`${value}T12:00:00.000Z`) : undefined)),
  heightCm: optionalNumber.refine(
    (value) => value === undefined || (value >= 80 && value <= 250),
    "La estatura debe estar entre 80 y 250 cm",
  ),
  primaryGoal: optionalText,
  trainingLevel: trainingLevelSchema.optional(),
  currentProgram: optionalText,
  currentWeek: optionalNumber.refine(
    (value) =>
      value === undefined || (Number.isInteger(value) && value >= 1 && value <= 104),
    "La semana debe estar entre 1 y 104",
  ),
  notes: z
    .string()
    .trim()
    .max(2_000)
    .optional()
    .transform((value) => value || undefined),
});

export const clientUpdateSchema = clientInputSchema.partial();
export const listClientsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: clientStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export const assessmentInputSchema = z.object({
  assessedAt: z
    .string()
    .date()
    .optional()
    .transform((value) => (value ? new Date(`${value}T12:00:00.000Z`) : undefined)),
  weightKg: optionalNumber.refine(
    (value) => value === undefined || (value >= 20 && value <= 400),
    "El peso debe estar entre 20 y 400 kg",
  ),
  bodyFatPercentage: optionalNumber.refine(
    (value) => value === undefined || (value >= 1 && value <= 80),
    "El porcentaje debe estar entre 1 y 80",
  ),
  chestCm: optionalNumber,
  waistCm: optionalNumber,
  hipCm: optionalNumber,
  notes: z
    .string()
    .trim()
    .max(2_000)
    .optional()
    .transform((value) => value || undefined),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
export type ClientUpdate = z.infer<typeof clientUpdateSchema>;
export type AssessmentInput = z.infer<typeof assessmentInputSchema>;
