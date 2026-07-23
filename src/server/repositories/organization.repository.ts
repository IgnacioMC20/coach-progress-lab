import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

// A deterministic id makes the first-run bootstrap safe when two instances
// receive requests at the same time and both observe an empty database.
const DEFAULT_ORGANIZATION_ID = "000000000000000000000001";
const DEFAULT_ORGANIZATION_NAME = "Coach Progress Lab";

export async function findOrCreateDefaultOrganization() {
  const existingOrganization = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existingOrganization) return existingOrganization;

  try {
    return await prisma.organization.create({
      data: {
        id: DEFAULT_ORGANIZATION_ID,
        name: DEFAULT_ORGANIZATION_NAME,
      },
    });
  } catch (error) {
    // Another serverless instance may have created the organization between
    // the initial read and this insert. Re-read only for that expected race.
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }

    return prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
    });
  }
}
