import { z } from "zod";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";

export const workoutSessionStatusSchema = z.enum(["IN_PROGRESS", "COMPLETED"], {
  error: "Selecciona un estado válido",
});
export const techniqueStatusSchema = z.enum(
  ["GOOD", "ADJUSTED", "NEEDS_ATTENTION"],
  { error: "Selecciona un estado de técnica válido" },
);

const optionalText = z
  .string()
  .trim()
  .max(2_000, "No puede superar 2,000 caracteres")
  .optional()
  .transform((value) => value || undefined);
const optionalNumber = (min: number, max: number) =>
  z
    .union([
      z.coerce
        .number()
        .finite("Escribe un número válido")
        .min(min, `El valor mínimo es ${min}`)
        .max(max, `El valor máximo es ${max}`),
      z.literal(""),
    ])
    .optional()
    .transform((value) =>
      value === "" || value === undefined ? undefined : value,
    );
const optionalInteger = (min: number, max: number) =>
  z
    .union([
      z.coerce
        .number()
        .int("Escribe un número entero")
        .min(min, `El valor mínimo es ${min}`)
        .max(max, `El valor máximo es ${max}`),
      z.literal(""),
    ])
    .optional()
    .transform((value) =>
      value === "" || value === undefined ? undefined : value,
    );

export const workoutSetInputSchema = z
  .object({
    weightKg: optionalNumber(0, 1_000),
    reps: optionalInteger(0, 500),
    durationSeconds: optionalInteger(0, 86_400),
    rir: optionalNumber(0, 5),
    technique: techniqueStatusSchema
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    painLevel: optionalInteger(0, 10),
    notes: optionalText,
  })
  .refine(
    (set) =>
      set.weightKg !== undefined ||
      set.reps !== undefined ||
      set.durationSeconds !== undefined,
    {
      message: "Registra carga y repeticiones, o una duración para cada serie",
      path: ["reps"],
    },
  );

export const workoutExerciseInputSchema = z.object({
  exerciseId: objectIdSchema,
  notes: optionalText,
  sets: z.array(workoutSetInputSchema).min(1, "Agrega al menos una serie"),
});

const workoutContentSchema = z.object({
  performedAt: z
    .string()
    .datetime("Escribe una fecha y hora válidas")
    .or(z.string().date("Escribe una fecha válida"))
    .transform(
      (value) =>
        new Date(value.includes("T") ? value : `${value}T12:00:00.000Z`),
    ),
  status: workoutSessionStatusSchema.default("IN_PROGRESS"),
  notes: optionalText,
  exercises: z
    .array(workoutExerciseInputSchema)
    .min(1, "Agrega al menos un ejercicio"),
});

export const workoutInputSchema = workoutContentSchema.extend({
  clientId: objectIdSchema,
});
export const workoutUpdateSchema = z.object({
  performedAt: workoutContentSchema.shape.performedAt.optional(),
  status: workoutSessionStatusSchema.optional(),
  notes: optionalText,
  exercises: z.array(workoutExerciseInputSchema).min(1).optional(),
});

export const listWorkoutsQuerySchema = z.object({
  clientId: objectIdSchema.optional(),
  weekStart: z
    .string()
    .date()
    .optional()
    .transform((value) =>
      value ? new Date(`${value}T00:00:00.000Z`) : undefined,
    ),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type WorkoutInput = z.infer<typeof workoutInputSchema>;
export type WorkoutUpdate = z.infer<typeof workoutUpdateSchema>;
