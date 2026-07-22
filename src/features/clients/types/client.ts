export type ClientStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
export type TrainingLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type ClientAssessment = {
  id: string;
  assessedAt: string;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  waistCm: number | null;
  chestCm: number | null;
  hipCm: number | null;
  notes: string | null;
};
export type ClientRoutineAssignment = {
  id: string;
  routineId: string;
  routineName: string;
  version: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  startDate: string;
  endDate: string | null;
};
export type ClientCircuitAssignment = {
  id: string;
  circuitId: string;
  circuitName: string;
  version: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  startDate: string;
  endDate: string | null;
};
export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: ClientStatus;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  age: number | null;
  heightCm: number | null;
  bmi: number | null;
  primaryGoal: string | null;
  trainingLevel: TrainingLevel | null;
  currentProgram: string | null;
  currentWeek: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  latestAssessment: ClientAssessment | null;
  assessmentCount: number;
};
export type ClientDetail = Client & {
  assessments: ClientAssessment[];
  routineAssignments: ClientRoutineAssignment[];
  circuitAssignments: ClientCircuitAssignment[];
};
export type PaginatedClients = {
  items: Client[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    active: number;
    paused: number;
    completed: number;
    evaluations: number;
  };
};
