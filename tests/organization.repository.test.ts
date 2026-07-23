import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const database = vi.hoisted(() => ({
  organization: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/server/db/prisma", () => ({ prisma: database }));

import { findOrCreateDefaultOrganization } from "@/server/repositories/organization.repository";

describe("default organization bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses the oldest organization when one already exists", async () => {
    const organization = { id: "existing-org", name: "Mi organización" };
    database.organization.findFirst.mockResolvedValue(organization);

    await expect(findOrCreateDefaultOrganization()).resolves.toBe(organization);
    expect(database.organization.create).not.toHaveBeenCalled();
  });

  it("creates the default organization when the database is empty", async () => {
    const organization = { id: "default-org", name: "Coach Progress Lab" };
    database.organization.findFirst.mockResolvedValueOnce(null);
    database.organization.create.mockResolvedValue(organization);

    await expect(findOrCreateDefaultOrganization()).resolves.toBe(organization);
    expect(database.organization.create).toHaveBeenCalledWith({
      data: {
        id: "000000000000000000000001",
        name: "Coach Progress Lab",
      },
    });
  });

  it("re-reads after another instance wins the bootstrap race", async () => {
    const organization = { id: "default-org", name: "Coach Progress Lab" };
    database.organization.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(organization);
    database.organization.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(findOrCreateDefaultOrganization()).resolves.toBe(organization);
    expect(database.organization.findFirst).toHaveBeenCalledTimes(2);
  });
});
