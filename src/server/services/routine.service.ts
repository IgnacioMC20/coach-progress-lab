import "server-only";
import { Prisma } from "@prisma/client";
import type {
  RoutineAssignmentInput,
  RoutineAssignmentUpdate,
  RoutineInput,
  RoutineUpdate,
  RoutineVersionInput,
} from "@/features/routines/schemas/routine.schema";
import type { RoutineStatus } from "@/features/routines/types/routine";
import { ApiError } from "@/server/errors/api-error";
import { routineRepository } from "@/server/repositories/routine.repository";
import { toRoutineDetailDto, toRoutineDto } from "./routine.mapper";

type ListInput = {
  q?: string;
  status?: RoutineStatus;
  page: number;
  limit: number;
};

const notFound = () => new ApiError("NOT_FOUND", "Routine not found", 404);

function exerciseIds(input: Pick<RoutineVersionInput, "days">) {
  return input.days.flatMap((day) =>
    day.blocks.flatMap((block) =>
      block.exercises.map((exercise) => exercise.exerciseId),
    ),
  );
}

export const routineService = {
  async list(input: ListInput) {
    const organization = await routineRepository.findDefaultOrganization();
    if (!organization)
      return {
        items: [],
        page: input.page,
        limit: input.limit,
        total: 0,
        totalPages: 1,
        summary: { total: 0, draft: 0, published: 0, assignments: 0 },
      };
    const where: Prisma.RoutineTemplateWhereInput = {
      organizationId: organization.id,
      status: input.status,
      ...(input.q ? { name: { contains: input.q, mode: "insensitive" } } : {}),
    };
    const [routines, total, draft, published, assignments] = await Promise.all([
      routineRepository.findMany(
        where,
        (input.page - 1) * input.limit,
        input.limit,
      ),
      routineRepository.count(where),
      routineRepository.count({ ...where, status: "DRAFT" }),
      routineRepository.count({ ...where, status: "PUBLISHED" }),
      routineRepository.countAssignments(organization.id),
    ]);
    return {
      items: routines.map(toRoutineDto),
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
      summary: { total, draft, published, assignments },
    };
  },
  async get(id: string) {
    const routine = await routineRepository.findById(id);
    if (!routine) throw notFound();
    const ids = routine.versions.flatMap((version) =>
      version.days.flatMap((day) =>
        day.blocks.flatMap((block) =>
          block.exercises.map((exercise) => exercise.exerciseId),
        ),
      ),
    );
    const exercises = await routineRepository.findExercises(
      [...new Set(ids)],
      routine.organizationId,
    );
    return toRoutineDetailDto(
      routine,
      new Map(exercises.map((exercise) => [exercise.id, exercise])),
    );
  },
  async validateExercises(
    input: Pick<RoutineVersionInput, "days">,
    organizationId: string,
  ) {
    const ids = [...new Set(exerciseIds(input))];
    const exercises = await routineRepository.findExercises(
      ids,
      organizationId,
    );
    if (exercises.length !== ids.length)
      throw new ApiError(
        "VALIDATION_ERROR",
        "One or more exercises are unavailable",
        400,
      );
  },
  async create(input: RoutineInput) {
    const organization = await routineRepository.findDefaultOrganization();
    if (!organization)
      throw new ApiError(
        "SETUP_REQUIRED",
        "An organization is required before creating routines",
        409,
      );
    await this.validateExercises(input, organization.id);
    const routine = await routineRepository.create(input, organization.id);
    return this.get(routine.id);
  },
  async update(id: string, input: RoutineUpdate) {
    if (!(await routineRepository.findById(id))) throw notFound();
    await routineRepository.update(id, input);
    return this.get(id);
  },
  async addVersion(id: string, input: RoutineVersionInput) {
    const routine = await routineRepository.findById(id);
    if (!routine) throw notFound();
    await this.validateExercises(input, routine.organizationId);
    await routineRepository.createVersion(id, input);
    return this.get(id);
  },
  async assign(id: string, input: RoutineAssignmentInput) {
    const routine = await routineRepository.findById(id);
    if (!routine) throw notFound();
    if (routine.status === "ARCHIVED")
      throw new ApiError(
        "VALIDATION_ERROR",
        "Archived routines cannot be assigned",
        400,
      );
    const [client, version] = await Promise.all([
      routineRepository.findClient(input.clientId, routine.organizationId),
      routineRepository.findVersion(id, input.routineVersionId),
    ]);
    if (!client) throw new ApiError("NOT_FOUND", "Client not found", 404);
    if (!version)
      throw new ApiError(
        "VALIDATION_ERROR",
        "Routine version is unavailable",
        400,
      );
    const assignment = await routineRepository.assign(id, input);
    return {
      id: assignment.id,
      clientId: assignment.clientId,
      clientName: `${assignment.client.firstName} ${assignment.client.lastName}`,
      status: assignment.status,
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate?.toISOString() ?? null,
      version: assignment.routineVersion.version,
    };
  },
  async updateAssignment(id: string, input: RoutineAssignmentUpdate) {
    if (!(await routineRepository.findAssignment(id)))
      throw new ApiError("NOT_FOUND", "Routine assignment not found", 404);
    const assignment = await routineRepository.updateAssignment(id, input);
    return {
      id: assignment.id,
      clientId: assignment.clientId,
      clientName: `${assignment.client.firstName} ${assignment.client.lastName}`,
      status: assignment.status,
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate?.toISOString() ?? null,
      version: assignment.routineVersion.version,
    };
  },
  async remove(id: string) {
    if (!(await routineRepository.findById(id))) throw notFound();
    await routineRepository.delete(id);
  },
};
