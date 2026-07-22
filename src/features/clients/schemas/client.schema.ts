import { z } from "zod";

export const clientStatusSchema = z.enum(
  ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"],
  { error: "Selecciona un estado válido" },
);
export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Selecciona una opción válida");
export const trainingLevelSchema = z.enum(
  ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
  { error: "Selecciona un nivel válido" },
);
const optionalText = z
  .string()
  .trim()
  .max(500, "No puede superar 500 caracteres")
  .optional()
  .transform((value) => value || undefined);
const optionalNumber = z.coerce.number().finite().optional();

export const clientInputSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Escribe un nombre de al menos 2 caracteres")
    .max(80, "El nombre no puede superar 80 caracteres"),
  lastName: z
    .string()
    .trim()
    .min(2, "Escribe un apellido de al menos 2 caracteres")
    .max(80, "El apellido no puede superar 80 caracteres"),
  status: clientStatusSchema.default("ACTIVE"),
  email: z
    .string()
    .trim()
    .email("Escribe un correo electrónico válido")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  phone: optionalText,
  birthDate: z
    .string()
    .date("Escribe una fecha válida")
    .optional()
    .or(z.literal(""))
    .transform((value) =>
      value ? new Date(`${value}T12:00:00.000Z`) : undefined,
    ),
  heightCm: optionalNumber.refine(
    (value) => value === undefined || (value >= 80 && value <= 250),
    "La estatura debe estar entre 80 y 250 cm",
  ),
  primaryGoal: optionalText,
  trainingLevel: trainingLevelSchema
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  currentProgram: optionalText,
  currentWeek: optionalNumber.refine(
    (value) =>
      value === undefined ||
      (Number.isInteger(value) && value >= 1 && value <= 104),
    "La semana debe estar entre 1 y 104",
  ),
  notes: z
    .string()
    .trim()
    .max(2_000, "Las notas no pueden superar 2,000 caracteres")
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
export const assessmentFormSchema = z.object({
  assessedAt: z.string().date("Escribe una fecha válida").optional(),
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
    .max(2_000, "Las observaciones no pueden superar 2,000 caracteres")
    .optional()
    .transform((value) => value || undefined),
});

export const assessmentInputSchema = assessmentFormSchema.extend({
  assessedAt: z
    .string()
    .date()
    .optional()
    .transform((value) =>
      value ? new Date(`${value}T12:00:00.000Z`) : undefined,
    ),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
export type ClientUpdate = z.infer<typeof clientUpdateSchema>;
export type AssessmentInput = z.infer<typeof assessmentInputSchema>;
