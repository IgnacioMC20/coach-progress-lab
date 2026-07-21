import { z } from "zod";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";

export const circuitStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const circuitAssignmentStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
]);

const optionalText = z
  .string()
  .trim()
  .max(2_000)
  .optional()
  .transform((value) => value || undefined);
const optionalInteger = (min: number, max: number) =>
  z
    .union([z.coerce.number().int().min(min).max(max), z.literal("")])
    .optional()
    .transform((value) =>
      value === "" || value === undefined ? undefined : value,
    );
const optionalNumber = (min: number, max: number) =>
  z
    .union([z.coerce.number().finite().min(min).max(max), z.literal("")])
    .optional()
    .transform((value) =>
      value === "" || value === undefined ? undefined : value,
    );

export const circuitExerciseInputSchema = z
  .object({
    exerciseId: objectIdSchema,
    reps: optionalInteger(1, 500),
    targetWeightKg: optionalNumber(0, 1_000),
    durationSeconds: optionalInteger(1, 86_400),
    notes: optionalText,
  })
  .refine(
    (exercise) =>
      exercise.reps !== undefined || exercise.durationSeconds !== undefined,
    "Indica repeticiones o duración para cada ejercicio",
  );

const circuitContentSchema = z.object({
  rounds: z.coerce.number().int().min(1).max(50),
  restBetweenRoundsSeconds: optionalInteger(0, 3_600),
  notes: optionalText,
  exercises: z
    .array(circuitExerciseInputSchema)
    .min(1, "Agrega al menos un ejercicio"),
});

export const circuitInputSchema = circuitContentSchema.extend({
  name: z.string().trim().min(2).max(120),
  description: optionalText,
  status: circuitStatusSchema.default("DRAFT"),
});
export const circuitUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: optionalText,
  status: circuitStatusSchema.optional(),
});
export const circuitVersionInputSchema = circuitContentSchema;
export const listCircuitsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: circuitStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export const circuitAssignmentInputSchema = z.object({
  clientId: objectIdSchema,
  circuitVersionId: objectIdSchema,
  startDate: z
    .string()
    .date()
    .optional()
    .transform((value) =>
      value ? new Date(`${value}T12:00:00.000Z`) : undefined,
    ),
});
export const circuitAssignmentUpdateSchema = z.object({
  status: circuitAssignmentStatusSchema,
  endDate: z
    .string()
    .date()
    .optional()
    .transform((value) =>
      value ? new Date(`${value}T12:00:00.000Z`) : undefined,
    ),
});

export type CircuitInput = z.infer<typeof circuitInputSchema>;
export type CircuitUpdate = z.infer<typeof circuitUpdateSchema>;
export type CircuitVersionInput = z.infer<typeof circuitVersionInputSchema>;
export type CircuitAssignmentInput = z.infer<
  typeof circuitAssignmentInputSchema
>;
export type CircuitAssignmentUpdate = z.infer<
  typeof circuitAssignmentUpdateSchema
>;
