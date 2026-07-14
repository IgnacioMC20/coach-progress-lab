import { z } from "zod";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";

export const measurementTypeSchema = z.enum([
  "WEIGHT_REPS",
  "BODYWEIGHT_REPS",
  "DURATION",
  "DISTANCE",
]);
export const equipmentTypeSchema = z.enum([
  "BARBELL",
  "DUMBBELL",
  "KETTLEBELL",
  "MACHINE",
  "CABLE",
  "BAND",
  "BODYWEIGHT",
  "OTHER",
]);
export const muscleGroupSchema = z.enum([
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "QUADRICEPS",
  "HAMSTRINGS",
  "GLUTES",
  "CALVES",
  "CORE",
  "FULL_BODY",
]);
export const movementPatternSchema = z.enum([
  "SQUAT",
  "HINGE",
  "HORIZONTAL_PUSH",
  "VERTICAL_PUSH",
  "HORIZONTAL_PULL",
  "VERTICAL_PULL",
  "LUNGE",
  "CARRY",
  "ROTATION",
  "ISOLATION",
]);
export const progressionPolicySchema = z.enum([
  "DOUBLE_PROGRESSION",
  "LOAD_FIRST",
  "REPETITIONS_FIRST",
  "RIR_BASED",
]);

const optionalText = z
  .string()
  .trim()
  .max(2_000)
  .optional()
  .transform((value) => value || undefined);
const minimumIncrementSchema = z
  .union([z.coerce.number().finite(), z.literal("")])
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value))
  .refine(
    (value) => value === undefined || (value > 0 && value <= 100),
    "El incremento mínimo debe ser mayor que 0 y menor o igual a 100",
  );

export const exerciseInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalText,
  measurementType: measurementTypeSchema,
  equipment: equipmentTypeSchema,
  primaryMuscles: z
    .array(muscleGroupSchema)
    .min(1, "Selecciona al menos un músculo principal"),
  secondaryMuscles: z.array(muscleGroupSchema).default([]),
  movementPattern: movementPatternSchema,
  minimumIncrement: minimumIncrementSchema,
  progressionPolicy: progressionPolicySchema,
  substituteIds: z
    .array(objectIdSchema)
    .default([])
    .refine((ids) => new Set(ids).size === ids.length, "No repitas sustituciones"),
});

export const exerciseUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: optionalText,
  measurementType: measurementTypeSchema.optional(),
  equipment: equipmentTypeSchema.optional(),
  primaryMuscles: z
    .array(muscleGroupSchema)
    .min(1, "Selecciona al menos un músculo principal")
    .optional(),
  secondaryMuscles: z.array(muscleGroupSchema).optional(),
  movementPattern: movementPatternSchema.optional(),
  minimumIncrement: minimumIncrementSchema,
  progressionPolicy: progressionPolicySchema.optional(),
  substituteIds: z
    .array(objectIdSchema)
    .refine((ids) => new Set(ids).size === ids.length, "No repitas sustituciones")
    .optional(),
});
export const listExercisesQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  equipment: equipmentTypeSchema.optional(),
  movementPattern: movementPatternSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
export type ExerciseUpdate = z.infer<typeof exerciseUpdateSchema>;
