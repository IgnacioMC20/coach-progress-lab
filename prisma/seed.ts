import {
  ClientStatus,
  EquipmentType,
  MeasurementType,
  MuscleGroup,
  MovementPattern,
  PrismaClient,
  ProgressionPolicy,
  TrainingLevel,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const demoClients = [
  {
    firstName: "Ligia",
    lastName: "Morales",
    status: ClientStatus.ACTIVE,
    primaryGoal: "Hipertrofia",
    trainingLevel: TrainingLevel.INTERMEDIATE,
    currentProgram: "Hipertrofia 12 semanas",
    currentWeek: 6,
    birthDate: new Date("1993-05-12"),
    heightCm: 164,
    email: "ligia@example.com",
    weightKg: 62.4,
  },
  {
    firstName: "Daniela",
    lastName: "Pérez",
    status: ClientStatus.ACTIVE,
    primaryGoal: "Pérdida de grasa",
    trainingLevel: TrainingLevel.BEGINNER,
    currentProgram: "Pérdida de grasa 12 sem.",
    currentWeek: 4,
    birthDate: new Date("1996-08-21"),
    heightCm: 169,
    email: "daniela@example.com",
    weightKg: 68.2,
  },
  {
    firstName: "Carlos",
    lastName: "Méndez",
    status: ClientStatus.ACTIVE,
    primaryGoal: "Fuerza general",
    trainingLevel: TrainingLevel.ADVANCED,
    currentProgram: "Fuerza 16 semanas",
    currentWeek: 7,
    birthDate: new Date("1988-11-04"),
    heightCm: 178,
    email: "carlos@example.com",
    weightKg: 81.6,
  },
  {
    firstName: "Andrea",
    lastName: "López",
    status: ClientStatus.PAUSED,
    primaryGoal: "Hipertrofia",
    trainingLevel: TrainingLevel.INTERMEDIATE,
    currentProgram: "Hipertrofia 12 semanas",
    currentWeek: 5,
    birthDate: new Date("1990-02-15"),
    heightCm: 161,
    email: "andrea@example.com",
    weightKg: 58.1,
  },
] as const;

const demoExercises = [
  {
    name: "Sentadilla con barra",
    description: "Sentadilla trasera con barra alta.",
    measurementType: MeasurementType.WEIGHT_REPS,
    equipment: EquipmentType.BARBELL,
    primaryMuscles: [MuscleGroup.QUADRICEPS, MuscleGroup.GLUTES],
    secondaryMuscles: [MuscleGroup.CORE, MuscleGroup.HAMSTRINGS],
    movementPattern: MovementPattern.SQUAT,
    minimumIncrement: 2.5,
    progressionPolicy: ProgressionPolicy.DOUBLE_PROGRESSION,
  },
  {
    name: "Sentadilla goblet",
    description: "Sentadilla con mancuerna o kettlebell al pecho.",
    measurementType: MeasurementType.WEIGHT_REPS,
    equipment: EquipmentType.KETTLEBELL,
    primaryMuscles: [MuscleGroup.QUADRICEPS, MuscleGroup.GLUTES],
    secondaryMuscles: [MuscleGroup.CORE],
    movementPattern: MovementPattern.SQUAT,
    minimumIncrement: 2,
    progressionPolicy: ProgressionPolicy.DOUBLE_PROGRESSION,
  },
  {
    name: "Peso muerto rumano",
    description: "Bisagra de cadera con énfasis en isquiosurales.",
    measurementType: MeasurementType.WEIGHT_REPS,
    equipment: EquipmentType.BARBELL,
    primaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.GLUTES],
    secondaryMuscles: [MuscleGroup.BACK],
    movementPattern: MovementPattern.HINGE,
    minimumIncrement: 2.5,
    progressionPolicy: ProgressionPolicy.LOAD_FIRST,
  },
  {
    name: "Press de banca con barra",
    description: "Press horizontal con barra.",
    measurementType: MeasurementType.WEIGHT_REPS,
    equipment: EquipmentType.BARBELL,
    primaryMuscles: [MuscleGroup.CHEST],
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
    movementPattern: MovementPattern.HORIZONTAL_PUSH,
    minimumIncrement: 2.5,
    progressionPolicy: ProgressionPolicy.DOUBLE_PROGRESSION,
  },
  {
    name: "Press de pecho con mancuernas",
    description: "Press horizontal con mancuernas.",
    measurementType: MeasurementType.WEIGHT_REPS,
    equipment: EquipmentType.DUMBBELL,
    primaryMuscles: [MuscleGroup.CHEST],
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
    movementPattern: MovementPattern.HORIZONTAL_PUSH,
    minimumIncrement: 1,
    progressionPolicy: ProgressionPolicy.DOUBLE_PROGRESSION,
  },
  {
    name: "Jalón al pecho",
    description: "Tracción vertical en polea.",
    measurementType: MeasurementType.WEIGHT_REPS,
    equipment: EquipmentType.CABLE,
    primaryMuscles: [MuscleGroup.BACK],
    secondaryMuscles: [MuscleGroup.BICEPS],
    movementPattern: MovementPattern.VERTICAL_PULL,
    minimumIncrement: 2.5,
    progressionPolicy: ProgressionPolicy.REPETITIONS_FIRST,
  },
  {
    name: "Remo con cable",
    description: "Tracción horizontal sentado en polea.",
    measurementType: MeasurementType.WEIGHT_REPS,
    equipment: EquipmentType.CABLE,
    primaryMuscles: [MuscleGroup.BACK],
    secondaryMuscles: [MuscleGroup.BICEPS],
    movementPattern: MovementPattern.HORIZONTAL_PULL,
    minimumIncrement: 2.5,
    progressionPolicy: ProgressionPolicy.REPETITIONS_FIRST,
  },
];

async function main() {
  const existingOrganization = await prisma.organization.findFirst({
    where: { name: { in: ["Coach Progress Lab Demo", "Coach Progress Demo"] } },
  });
  const organization = existingOrganization
    ? await prisma.organization.update({
        where: { id: existingOrganization.id },
        data: { name: "Coach Progress Lab Demo" },
      })
    : await prisma.organization.create({
        data: { name: "Coach Progress Lab Demo" },
      });

  const coach = await prisma.user.upsert({
    where: { email: "coach@coachprogress.local" },
    update: {
      name: "María López",
      role: UserRole.OWNER,
      organizationId: organization.id,
    },
    create: {
      name: "María López",
      email: "coach@coachprogress.local",
      role: UserRole.OWNER,
      organizationId: organization.id,
    },
  });

  for (const { weightKg, ...clientData } of demoClients) {
    const existingClient = await prisma.client.findFirst({
      where: { email: clientData.email },
    });
    const client = existingClient
      ? await prisma.client.update({
          where: { id: existingClient.id },
          data: {
            ...clientData,
            organizationId: organization.id,
            coachId: coach.id,
          },
        })
      : await prisma.client.create({
          data: {
            ...clientData,
            organizationId: organization.id,
            coachId: coach.id,
          },
        });

    const assessment = await prisma.clientAssessment.findFirst({
      where: { clientId: client.id },
    });
    if (assessment) {
      await prisma.clientAssessment.update({
        where: { id: assessment.id },
        data: { weightKg, bodyFatPercentage: 24, waistCm: 72 },
      });
    } else {
      await prisma.clientAssessment.create({
        data: {
          clientId: client.id,
          weightKg,
          bodyFatPercentage: 24,
          waistCm: 72,
        },
      });
    }
  }

  const exerciseByName = new Map<string, string>();
  for (const exerciseData of demoExercises) {
    const exercise = await prisma.exercise.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: exerciseData.name,
        },
      },
      update: { ...exerciseData },
      create: {
        ...exerciseData,
        organizationId: organization.id,
        substituteIds: [],
      },
    });
    exerciseByName.set(exercise.name, exercise.id);
  }

  const substitutions: Record<string, string[]> = {
    "Sentadilla con barra": ["Sentadilla goblet"],
    "Sentadilla goblet": ["Sentadilla con barra"],
    "Press de banca con barra": ["Press de pecho con mancuernas"],
    "Press de pecho con mancuernas": ["Press de banca con barra"],
  };
  await Promise.all(
    Object.entries(substitutions).map(([name, replacementNames]) =>
      prisma.exercise.update({
        where: {
          organizationId_name: { organizationId: organization.id, name },
        },
        data: {
          substituteIds: replacementNames.flatMap((replacementName) => {
            const id = exerciseByName.get(replacementName);
            return id ? [id] : [];
          }),
        },
      }),
    ),
  );

  const existingRoutine = await prisma.routineTemplate.findFirst({
    where: { organizationId: organization.id, name: "Fuerza base · 3 días" },
  });
  if (!existingRoutine) {
    await prisma.routineTemplate.create({
      data: {
        name: "Fuerza base · 3 días",
        description: "Plantilla demo con básicos de fuerza y accesorios.",
        status: "PUBLISHED",
        organizationId: organization.id,
        versions: {
          create: {
            version: 1,
            notes: "Versión inicial de la plantilla demo.",
            days: {
              create: [
                {
                  name: "Día A · Tren inferior",
                  position: 1,
                  blocks: {
                    create: [
                      {
                        name: "Bloque principal",
                        type: "STRAIGHT_SET",
                        position: 1,
                        restSeconds: 150,
                        exercises: {
                          create: [
                            {
                              exerciseId: exerciseByName.get(
                                "Sentadilla con barra",
                              )!,
                              position: 1,
                              sets: 4,
                              repsMin: 5,
                              repsMax: 6,
                              rir: 2,
                              restSeconds: 150,
                            },
                            {
                              exerciseId:
                                exerciseByName.get("Peso muerto rumano")!,
                              position: 2,
                              sets: 3,
                              repsMin: 8,
                              repsMax: 10,
                              rir: 2,
                              restSeconds: 120,
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  name: "Día B · Tren superior",
                  position: 2,
                  blocks: {
                    create: [
                      {
                        name: "Superserie de empuje y tracción",
                        type: "SUPERSET",
                        position: 1,
                        restSeconds: 90,
                        exercises: {
                          create: [
                            {
                              exerciseId: exerciseByName.get(
                                "Press de banca con barra",
                              )!,
                              position: 1,
                              sets: 4,
                              repsMin: 6,
                              repsMax: 8,
                              rir: 2,
                              restSeconds: 90,
                            },
                            {
                              exerciseId: exerciseByName.get("Remo con cable")!,
                              position: 2,
                              sets: 4,
                              repsMin: 8,
                              repsMax: 12,
                              rir: 2,
                              restSeconds: 90,
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    });
  }

  const ligia = await prisma.client.findFirst({
    where: { email: "ligia@example.com", organizationId: organization.id },
  });
  if (ligia) {
    const progressionSessions = [
      {
        performedAt: new Date("2026-06-19T16:30:00.000Z"),
        notes: "Sesión demo de progresión · semana 1.",
        squat: { weightKg: 50, reps: 8, rir: 2 },
        rdl: { weightKg: 40, reps: 10, rir: 2 },
      },
      {
        performedAt: new Date("2026-06-26T16:30:00.000Z"),
        notes: "Sesión demo de progresión · semana 2.",
        squat: { weightKg: 52.5, reps: 9, rir: 2 },
        rdl: { weightKg: 42.5, reps: 10, rir: 2 },
      },
      {
        performedAt: new Date("2026-07-03T16:30:00.000Z"),
        notes: "Sesión demo de progresión · semana 3.",
        squat: { weightKg: 55, reps: 10, rir: 1 },
        rdl: { weightKg: 45, reps: 10, rir: 2, painLevel: 6 },
      },
    ];
    for (const session of progressionSessions) {
      const existingSession = await prisma.workoutSession.findFirst({
        where: { clientId: ligia.id, notes: session.notes },
      });
      if (!existingSession) {
        await prisma.workoutSession.create({
          data: {
            clientId: ligia.id,
            organizationId: organization.id,
            performedAt: session.performedAt,
            status: "COMPLETED",
            notes: session.notes,
            exercises: {
              create: [
                {
                  exerciseId: exerciseByName.get("Sentadilla con barra")!,
                  position: 1,
                  sets: {
                    create: [1, 2, 3].map((position) => ({
                      position,
                      ...session.squat,
                    })),
                  },
                },
                {
                  exerciseId: exerciseByName.get("Peso muerto rumano")!,
                  position: 2,
                  sets: {
                    create: [1, 2].map((position) => ({
                      position,
                      ...session.rdl,
                    })),
                  },
                },
              ],
            },
          },
        });
      }
    }

    const existingWorkout = await prisma.workoutSession.findFirst({
      where: { clientId: ligia.id, notes: "Sesión demo de tren inferior." },
    });
    if (!existingWorkout) {
      await prisma.workoutSession.create({
        data: {
          clientId: ligia.id,
          organizationId: organization.id,
          performedAt: new Date("2026-07-10T16:30:00.000Z"),
          status: "COMPLETED",
          notes: "Sesión demo de tren inferior.",
          exercises: {
            create: [
              {
                exerciseId: exerciseByName.get("Sentadilla con barra")!,
                position: 1,
                sets: {
                  create: [
                    {
                      position: 1,
                      weightKg: 55,
                      reps: 8,
                      rir: 2,
                      technique: "GOOD",
                    },
                    {
                      position: 2,
                      weightKg: 57.5,
                      reps: 8,
                      rir: 2,
                      technique: "GOOD",
                    },
                    {
                      position: 3,
                      weightKg: 57.5,
                      reps: 7,
                      rir: 1,
                      technique: "ADJUSTED",
                      notes: "Ligera pérdida de profundidad al final.",
                    },
                  ],
                },
              },
              {
                exerciseId: exerciseByName.get("Peso muerto rumano")!,
                position: 2,
                sets: {
                  create: [
                    {
                      position: 1,
                      weightKg: 45,
                      reps: 10,
                      rir: 2,
                      technique: "GOOD",
                    },
                    {
                      position: 2,
                      weightKg: 45,
                      reps: 10,
                      rir: 2,
                      technique: "GOOD",
                    },
                  ],
                },
              },
            ],
          },
        },
      });
    }

    const demoCheckIns = [
      {
        checkInDate: new Date("2026-06-15T12:00:00.000Z"),
        weightKg: 63.1,
        chestCm: 91,
        waistCm: 73.5,
        hipCm: 99,
        sleepHours: 6.8,
        steps: 7200,
        energyLevel: 3,
        hungerLevel: 4,
        nutritionAdherence: 76,
        notes: "Semana de adaptación al programa.",
      },
      {
        checkInDate: new Date("2026-06-22T12:00:00.000Z"),
        weightKg: 62.9,
        chestCm: 91,
        waistCm: 73,
        hipCm: 98.5,
        sleepHours: 7.1,
        steps: 8100,
        energyLevel: 4,
        hungerLevel: 3,
        nutritionAdherence: 82,
        notes: "Mejor recuperación entre sesiones.",
      },
      {
        checkInDate: new Date("2026-06-29T12:00:00.000Z"),
        weightKg: 62.7,
        chestCm: 90.5,
        waistCm: 72.5,
        hipCm: 98.5,
        sleepHours: 7.3,
        steps: 8800,
        energyLevel: 4,
        hungerLevel: 3,
        nutritionAdherence: 88,
        notes: "Buen manejo del hambre y buena energía.",
      },
      {
        checkInDate: new Date("2026-07-06T12:00:00.000Z"),
        weightKg: 62.6,
        chestCm: 90.5,
        waistCm: 72,
        hipCm: 98,
        sleepHours: 7.5,
        steps: 9300,
        energyLevel: 5,
        hungerLevel: 3,
        nutritionAdherence: 91,
        notes: "Semana consistente y sin molestias.",
      },
      {
        checkInDate: new Date("2026-07-13T12:00:00.000Z"),
        weightKg: 62.4,
        chestCm: 90,
        waistCm: 71.5,
        hipCm: 98,
        sleepHours: 7.4,
        steps: 9600,
        energyLevel: 4,
        hungerLevel: 3,
        nutritionAdherence: 93,
        notes: "Mantener la progresión actual esta semana.",
      },
    ];
    for (const checkIn of demoCheckIns) {
      const existingCheckIn = await prisma.checkIn.findFirst({
        where: { clientId: ligia.id, checkInDate: checkIn.checkInDate },
      });
      if (existingCheckIn)
        await prisma.checkIn.update({
          where: { id: existingCheckIn.id },
          data: checkIn,
        });
      else
        await prisma.checkIn.create({
          data: {
            ...checkIn,
            clientId: ligia.id,
            organizationId: organization.id,
          },
        });
    }
  }
}

main()
  .then(() => console.info("Seed completed."))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
