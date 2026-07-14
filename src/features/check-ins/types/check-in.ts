export type CheckIn = {
  id: string;
  clientId: string;
  clientName: string;
  checkInDate: string;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  sleepHours: number | null;
  steps: number | null;
  energyLevel: number | null;
  hungerLevel: number | null;
  nutritionAdherence: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedCheckIns = {
  items: CheckIn[];
  trend: CheckIn[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    averageSleepHours: number | null;
    averageEnergyLevel: number | null;
    averageNutritionAdherence: number | null;
    latestWeightKg: number | null;
  };
};
