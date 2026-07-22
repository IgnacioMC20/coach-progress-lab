import "server-only";
import { Prisma } from "@prisma/client";
import type {
  AssessmentInput,
  ClientInput,
  ClientUpdate,
} from "@/features/clients/schemas/client.schema";
import { ApiError } from "@/server/errors/api-error";
import { clientRepository } from "@/server/repositories/client.repository";
import { toClientDetailDto, toClientDto } from "./client.mapper";

type ListInput = {
  q?: string;
  status?: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  page: number;
  limit: number;
};
const buildWhere = (input: ListInput): Prisma.ClientWhereInput => ({
  status: input.status,
  ...(input.q
    ? {
        OR: [
          { firstName: { contains: input.q, mode: "insensitive" } },
          { lastName: { contains: input.q, mode: "insensitive" } },
          { email: { contains: input.q, mode: "insensitive" } },
        ],
      }
    : {}),
});
const notFound = () =>
  new ApiError("NOT_FOUND", "No encontramos el cliente.", 404);

export const clientService = {
  async list(input: ListInput) {
    const organization = await clientRepository.findDefaultOrganization();
    if (!organization)
      return {
        items: [],
        page: input.page,
        limit: input.limit,
        total: 0,
        totalPages: 1,
        summary: { active: 0, paused: 0, completed: 0, evaluations: 0 },
      };
    const where = {
      ...buildWhere(input),
      organizationId: organization.id,
    } satisfies Prisma.ClientWhereInput;
    const [records, total, active, paused, completed, evaluations] =
      await Promise.all([
        clientRepository.findMany(
          where,
          (input.page - 1) * input.limit,
          input.limit,
        ),
        clientRepository.count(where),
        clientRepository.count({ ...where, status: "ACTIVE" }),
        clientRepository.count({ ...where, status: "PAUSED" }),
        clientRepository.count({ ...where, status: "COMPLETED" }),
        import("@/server/db/prisma").then(({ prisma }) =>
          prisma.clientAssessment.count({
            where: { client: { organizationId: organization.id } },
          }),
        ),
      ]);
    return {
      items: records.map(toClientDto),
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
      summary: { active, paused, completed, evaluations },
    };
  },
  async get(id: string) {
    const client = await clientRepository.findById(id);
    if (!client) throw notFound();
    return toClientDetailDto(client);
  },
  async create(input: ClientInput) {
    const context = await clientRepository.findDefaultContext();
    if (!context)
      throw new ApiError(
        "SETUP_REQUIRED",
        "Configura una organización antes de crear clientes.",
        409,
      );
    return toClientDto(await clientRepository.create(input, context));
  },
  async update(id: string, input: ClientUpdate) {
    await this.get(id);
    return toClientDto(await clientRepository.update(id, input));
  },
  async remove(id: string) {
    await this.get(id);
    await clientRepository.delete(id);
  },
  async addAssessment(id: string, input: AssessmentInput) {
    await this.get(id);
    const assessment = await clientRepository.createAssessment(id, input);
    return {
      ...assessment,
      assessedAt: assessment.assessedAt.toISOString(),
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString(),
    };
  },
  async updateAssessment(
    clientId: string,
    assessmentId: string,
    input: AssessmentInput,
  ) {
    if (!(await clientRepository.findAssessment(clientId, assessmentId)))
      throw new ApiError("NOT_FOUND", "No encontramos la evaluación.", 404);
    const assessment = await clientRepository.updateAssessment(
      assessmentId,
      input,
    );
    return {
      ...assessment,
      assessedAt: assessment.assessedAt.toISOString(),
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString(),
    };
  },
};
