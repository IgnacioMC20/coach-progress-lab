import { z } from "zod";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";

export const routineStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"], {
  error: "Selecciona un estado válido",
});
export const routineBlockTypeSchema = z.enum(
  ["STRAIGHT_SET", "SUPERSET", "CIRCUIT"],
  { error: "Selecciona un tipo de bloque válido" },
);
export const routineAssignmentStatusSchema = z.enum(
  ["ACTIVE", "PAUSED", "COMPLETED"],
  { error: "Selecciona un estado válido" },
);

const optionalText = z
  .string()
  .trim()
  .max(2_000, "No puede superar 2,000 caracteres")
  .optional()
  .transform((value) => value || undefined);
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

export const routineExerciseInputSchema = z
  .object({
    exerciseId: objectIdSchema,
    sets: z.coerce.number().int().min(1).max(20),
    repsMin: optionalInteger(1, 100),
    repsMax: optionalInteger(1, 100),
    rir: optionalNumber(0, 5),
    restSeconds: optionalInteger(0, 900),
    notes: optionalText,
  })
  .refine(
    ({ repsMin, repsMax }) =>
      repsMin === undefined || repsMax === undefined || repsMax >= repsMin,
    {
      message: "El máximo de repeticiones debe ser igual o mayor que el mínimo",
      path: ["repsMax"],
    },
  );

export const routineBlockInputSchema = z.object({
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  type: routineBlockTypeSchema.default("STRAIGHT_SET"),
  restSeconds: optionalInteger(0, 900),
  exercises: z
    .array(routineExerciseInputSchema)
    .min(1, "Agrega al menos un ejercicio"),
});

export const routineDayInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribe un nombre de al menos 2 caracteres")
    .max(120, "El nombre no puede superar 120 caracteres"),
  blocks: z.array(routineBlockInputSchema).min(1, "Agrega al menos un bloque"),
});

const routineContentSchema = z.object({
  notes: optionalText,
  days: z
    .array(routineDayInputSchema)
    .min(1, "Agrega al menos un día de entrenamiento"),
});

export const routineInputSchema = routineContentSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, "Escribe un nombre de al menos 2 caracteres")
    .max(120, "El nombre no puede superar 120 caracteres"),
  description: optionalText,
  status: routineStatusSchema.default("DRAFT"),
});

export const routineUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribe un nombre de al menos 2 caracteres")
    .max(120, "El nombre no puede superar 120 caracteres")
    .optional(),
  description: optionalText,
  status: routineStatusSchema.optional(),
});

export const routineVersionInputSchema = routineContentSchema;
export const listRoutinesQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: routineStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const routineAssignmentInputSchema = z.object({
  clientId: objectIdSchema,
  routineVersionId: objectIdSchema,
  startDate: z
    .string()
    .date()
    .optional()
    .transform((value) =>
      value ? new Date(`${value}T12:00:00.000Z`) : undefined,
    ),
});

export const routineAssignmentUpdateSchema = z.object({
  status: routineAssignmentStatusSchema,
  endDate: z
    .string()
    .date()
    .optional()
    .transform((value) =>
      value ? new Date(`${value}T12:00:00.000Z`) : undefined,
    ),
});

export type RoutineInput = z.infer<typeof routineInputSchema>;
export type RoutineUpdate = z.infer<typeof routineUpdateSchema>;
export type RoutineVersionInput = z.infer<typeof routineVersionInputSchema>;
export type RoutineAssignmentInput = z.infer<
  typeof routineAssignmentInputSchema
>;
export type RoutineAssignmentUpdate = z.infer<
  typeof routineAssignmentUpdateSchema
>;
