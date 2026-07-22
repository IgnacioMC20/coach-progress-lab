import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findDefaultOrganization: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}));
const database = vi.hoisted(() => ({
  clientAssessment: { count: vi.fn() },
}));

vi.mock("@/server/repositories/client.repository", () => ({
  clientRepository: repository,
}));
vi.mock("@/server/db/prisma", () => ({ prisma: database }));

import { clientService } from "@/server/services/client.service";
import { calculateProgression } from "@/server/services/progression.service";

describe("empty data safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a stable empty client response without an organization", async () => {
    repository.findDefaultOrganization.mockResolvedValue(null);

    await expect(clientService.list({ page: 1, limit: 12 })).resolves.toEqual({
      items: [],
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1,
      summary: { active: 0, paused: 0, completed: 0, evaluations: 0 },
    });
    expect(repository.findMany).not.toHaveBeenCalled();
    expect(repository.count).not.toHaveBeenCalled();
  });

  it("scopes an empty client workspace to its organization", async () => {
    repository.findDefaultOrganization.mockResolvedValue({ id: "org-1" });
    repository.findMany.mockResolvedValue([]);
    repository.count.mockResolvedValue(0);
    database.clientAssessment.count.mockResolvedValue(0);

    await expect(
      clientService.list({ page: 1, limit: 12 }),
    ).resolves.toMatchObject({
      items: [],
      total: 0,
      totalPages: 1,
      summary: { active: 0, paused: 0, completed: 0, evaluations: 0 },
    });
    expect(repository.findMany).toHaveBeenCalledWith(
      { organizationId: "org-1" },
      0,
      12,
    );
    expect(database.clientAssessment.count).toHaveBeenCalledWith({
      where: { client: { organizationId: "org-1" } },
    });
  });

  it("calculates a zero progression summary without sessions", () => {
    expect(
      calculateProgression(
        { id: "client-1", firstName: "Ana", lastName: "López" },
        [],
        [],
      ),
    ).toEqual({
      clientId: "client-1",
      clientName: "Ana López",
      exercises: [],
      summary: {
        totalVolumeKg: 0,
        personalRecords: 0,
        alerts: 0,
        averageE1RmChangePercentage: null,
      },
    });
  });
});
