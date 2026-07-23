import "server-only";
import { prisma } from "@/server/db/prisma";
import { findOrCreateDefaultOrganization } from "@/server/repositories/organization.repository";

export const onboardingRepository = {
  async findDefaultUser() {
    const organization = await findOrCreateDefaultOrganization();
    if (!organization) return null;
    return prisma.user.findFirst({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "asc" },
    });
  },
  markSeen: (userId: string, version: number, seenAt: Date) =>
    prisma.user.update({
      where: { id: userId },
      data: {
        onboardingTourVersion: version,
        onboardingTourSeenAt: seenAt,
      },
    }),
};
