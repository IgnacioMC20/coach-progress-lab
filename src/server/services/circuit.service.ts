import { Prisma } from "@prisma/client";
import type {
  CircuitAssignmentInput,
  CircuitAssignmentUpdate,
  CircuitInput,
  CircuitUpdate,
  CircuitVersionInput,
} from "@/features/circuits/schemas/circuit.schema";
import type { CircuitStatus } from "@/features/circuits/types/circuit";
import { ApiError } from "@/server/errors/api-error";
import { circuitRepository } from "@/server/repositories/circuit.repository";
import { toCircuitDetailDto, toCircuitDto } from "./circuit.mapper";

type ListInput = {
  q?: string;
  status?: CircuitStatus;
  page: number;
  limit: number;
};
const notFound = () => new ApiError("NOT_FOUND", "Circuit not found", 404);

function exerciseIds(input: Pick<CircuitVersionInput, "exercises">) {
  return [...new Set(input.exercises.map((exercise) => exercise.exerciseId))];
}
function assignmentDto(assignment: {
  id: string;
  clientId: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  startDate: Date;
  endDate: Date | null;
  client: { firstName: string; lastName: string };
  circuitVersion: { version: number };
}) {
  return {
    id: assignment.id,
    clientId: assignment.clientId,
    clientName: `${assignment.client.firstName} ${assignment.client.lastName}`,
    status: assignment.status,
    startDate: assignment.startDate.toISOString(),
    endDate: assignment.endDate?.toISOString() ?? null,
    version: assignment.circuitVersion.version,
  };
}

export const circuitService = {
  async list(input: ListInput) {
    const organization = await circuitRepository.findDefaultOrganization();
    if (!organization)
      return {
        items: [],
        page: input.page,
        limit: input.limit,
        total: 0,
        totalPages: 1,
        summary: { total: 0, draft: 0, published: 0, assignments: 0 },
      };
    const where: Prisma.CircuitTemplateWhereInput = {
      organizationId: organization.id,
      status: input.status,
      ...(input.q ? { name: { contains: input.q, mode: "insensitive" } } : {}),
    };
    const [circuits, total, draft, published, assignments] = await Promise.all([
      circuitRepository.findMany(
        where,
        (input.page - 1) * input.limit,
        input.limit,
      ),
      circuitRepository.count(where),
      circuitRepository.count({ ...where, status: "DRAFT" }),
      circuitRepository.count({ ...where, status: "PUBLISHED" }),
      circuitRepository.countAssignments(organization.id),
    ]);
    return {
      items: circuits.map(toCircuitDto),
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
      summary: { total, draft, published, assignments },
    };
  },
  async get(id: string) {
    const circuit = await circuitRepository.findById(id);
    if (!circuit) throw notFound();
    const ids = circuit.versions.flatMap((version) =>
      version.exercises.map((exercise) => exercise.exerciseId),
    );
    const exercises = await circuitRepository.findExercises(
      [...new Set(ids)],
      circuit.organizationId,
    );
    return toCircuitDetailDto(
      circuit,
      new Map(exercises.map((exercise) => [exercise.id, exercise])),
    );
  },
  async validateExercises(
    input: Pick<CircuitVersionInput, "exercises">,
    organizationId: string,
  ) {
    const ids = exerciseIds(input);
    const exercises = await circuitRepository.findExercises(
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
  async create(input: CircuitInput) {
    const organization = await circuitRepository.findDefaultOrganization();
    if (!organization)
      throw new ApiError(
        "SETUP_REQUIRED",
        "An organization is required before creating circuits",
        409,
      );
    await this.validateExercises(input, organization.id);
    const circuit = await circuitRepository.create(input, organization.id);
    return this.get(circuit.id);
  },
  async update(id: string, input: CircuitUpdate) {
    if (!(await circuitRepository.findById(id))) throw notFound();
    await circuitRepository.update(id, input);
    return this.get(id);
  },
  async addVersion(id: string, input: CircuitVersionInput) {
    const circuit = await circuitRepository.findById(id);
    if (!circuit) throw notFound();
    await this.validateExercises(input, circuit.organizationId);
    await circuitRepository.createVersion(id, input);
    return this.get(id);
  },
  async assign(id: string, input: CircuitAssignmentInput) {
    const circuit = await circuitRepository.findById(id);
    if (!circuit) throw notFound();
    if (circuit.status === "ARCHIVED")
      throw new ApiError(
        "VALIDATION_ERROR",
        "Archived circuits cannot be assigned",
        400,
      );
    const [client, version] = await Promise.all([
      circuitRepository.findClient(input.clientId, circuit.organizationId),
      circuitRepository.findVersion(id, input.circuitVersionId),
    ]);
    if (!client) throw new ApiError("NOT_FOUND", "Client not found", 404);
    if (!version)
      throw new ApiError(
        "VALIDATION_ERROR",
        "Circuit version is unavailable",
        400,
      );
    return assignmentDto(await circuitRepository.assign(id, input));
  },
  async updateAssignment(id: string, input: CircuitAssignmentUpdate) {
    if (!(await circuitRepository.findAssignment(id)))
      throw new ApiError("NOT_FOUND", "Circuit assignment not found", 404);
    return assignmentDto(await circuitRepository.updateAssignment(id, input));
  },
  async remove(id: string) {
    if (!(await circuitRepository.findById(id))) throw notFound();
    await circuitRepository.delete(id);
  },
};
