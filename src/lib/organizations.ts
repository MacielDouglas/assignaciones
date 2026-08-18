import { prisma } from "@/lib/prisma";

export async function getUserMembership(userId: string) {
  return prisma.organizationMember.findUnique({
    where: { userId },
    include: { organization: true },
  });
}

export async function requireOrganizationAccess(
  organizationId: string,
  userId: string,
  subUser: boolean,
) {
  if (subUser) return null;
  return getUserMembership(userId).then((membership) =>
    membership?.organizationId === organizationId ? membership : null,
  );
}
