import { cache } from "react";

import { prisma } from "@/lib/db";

import type { Actor } from "./access";
import { getMembership } from "./access";
import { OrgError } from "./errors";

export type CurrentContext =
  | { kind: "sub-user"; organizations: OrganizationWithCounts[] }
  | { kind: "member"; membership: NonNullable<Awaited<ReturnType<typeof getMembership>>> }
  | { kind: "none" };

type OrganizationWithCounts = {
  id: string;
  name: string;
  createdAt: Date;
  memberCount: number;
  personCount: number;
};

export const getCurrentContext = cache(async (actor: Actor): Promise<CurrentContext> => {
  if (actor.isSubUser) {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: { select: { members: true, persons: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      kind: "sub-user",
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        createdAt: org.createdAt,
        memberCount: org._count.members,
        personCount: org._count.persons,
      })),
    };
  }

  const membership = await getMembership(actor);
  if (!membership) {
    return { kind: "none" };
  }

  return { kind: "member", membership };
});

export type OrgContext =
  | {
      kind: "sub-user";
      organization: { id: string; name: string };
      canManagePeople: true;
      canManageRoles: true;
      canInvite: true;
    }
  | {
      kind: "member";
      organization: { id: string; name: string };
      membership: NonNullable<Awaited<ReturnType<typeof getMembership>>>;
      canManagePeople: boolean;
      canManageRoles: boolean;
      canInvite: boolean;
    };

export async function getOrgContext(actor: Actor, orgId?: string): Promise<OrgContext> {
  if (actor.isSubUser) {
    if (!orgId) {
      throw new OrgError("Organização não informada", "ORG_REQUIRED");
    }
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    });
    if (!organization) {
      throw new OrgError("Organização não encontrada", "ORG_NOT_FOUND");
    }
    return {
      kind: "sub-user",
      organization,
      canManagePeople: true,
      canManageRoles: true,
      canInvite: true,
    };
  }

  const membership = await getMembership(actor);
  if (!membership?.personId) {
    throw new OrgError("Você não tem acesso a esta organização", "FORBIDDEN");
  }
  if (orgId && membership.organizationId !== orgId) {
    throw new OrgError("Organização inválida", "ORG_MISMATCH");
  }

  const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

  return {
    kind: "member",
    organization: { id: membership.organizationId, name: membership.organization.name },
    membership,
    canManagePeople: canManage,
    canManageRoles: membership.role === "OWNER",
    canInvite: membership.role === "OWNER",
  };
}
