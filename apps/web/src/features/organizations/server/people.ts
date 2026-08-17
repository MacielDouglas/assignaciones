import { prisma } from "@/lib/db";

import type { Actor } from "./access";
import { getOrgContext } from "./context";
import { OrgError } from "./errors";

export async function listPeople(actor: Actor, orgId?: string) {
  const ctx = await getOrgContext(actor, orgId);
  if (!ctx.canManagePeople) {
    throw new OrgError("Apenas owners e admins podem ver as pessoas", "FORBIDDEN");
  }

  return prisma.person.findMany({
    where: { organizationId: ctx.organization.id },
    include: {
      member: {
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createPerson(
  actor: Actor,
  input: { organizationId: string; name: string; email?: string; phone?: string },
) {
  const ctx = await getOrgContext(actor, input.organizationId);
  if (!ctx.canManagePeople) {
    throw new OrgError("Apenas owners e admins podem criar pessoas", "FORBIDDEN");
  }

  return prisma.person.create({
    data: {
      organizationId: ctx.organization.id,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
    },
  });
}
