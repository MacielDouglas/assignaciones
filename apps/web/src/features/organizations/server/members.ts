import { prisma } from "@/lib/db";

import type { Actor } from "./access";
import { getOrgContext } from "./context";
import { OrgError } from "./errors";

export async function listMembers(actor: Actor, orgId?: string) {
  const ctx = await getOrgContext(actor, orgId);
  if (!ctx.canManagePeople) {
    throw new OrgError("Apenas owners e admins podem ver os membros", "FORBIDDEN");
  }

  return prisma.organizationMember.findMany({
    where: { organizationId: ctx.organization.id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      person: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateMemberRole(
  actor: Actor,
  memberId: string,
  role: "OWNER" | "ADMIN" | "MEMBER",
) {
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member) {
    throw new OrgError("Membro não encontrado", "NOT_FOUND");
  }

  const ctx = await getOrgContext(actor, member.organizationId);
  if (!ctx.canManageRoles) {
    throw new OrgError("Apenas owners podem alterar papéis", "FORBIDDEN");
  }

  if (!actor.isSubUser && member.userId === actor.userId) {
    throw new OrgError("Você não pode alterar o próprio papel", "FORBIDDEN");
  }

  if (member.role === "OWNER" && role !== "OWNER") {
    const ownerCount = await prisma.organizationMember.count({
      where: { organizationId: member.organizationId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      throw new OrgError("A organização precisa de pelo menos um owner", "LAST_OWNER");
    }
  }

  return prisma.organizationMember.update({ where: { id: member.id }, data: { role } });
}

export async function linkPersonToMember(actor: Actor, memberId: string, personId: string) {
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member) {
    throw new OrgError("Membro não encontrado", "NOT_FOUND");
  }
  if (member.personId) {
    throw new OrgError("Este membro já possui uma pessoa vinculada", "ALREADY_LINKED");
  }

  const ctx = await getOrgContext(actor, member.organizationId);
  if (!ctx.canManagePeople) {
    throw new OrgError("Apenas owners e admins podem vincular pessoas", "FORBIDDEN");
  }

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person || person.organizationId !== member.organizationId) {
    throw new OrgError("Pessoa inválida para esta organização", "PERSON_NOT_FOUND");
  }

  const alreadyLinked = await prisma.organizationMember.findUnique({ where: { personId } });
  if (alreadyLinked) {
    throw new OrgError("Esta pessoa já está vinculada a um usuário", "PERSON_ALREADY_LINKED");
  }

  return prisma.organizationMember.update({ where: { id: member.id }, data: { personId } });
}

export async function unlinkPersonFromMember(actor: Actor, memberId: string) {
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member) {
    throw new OrgError("Membro não encontrado", "NOT_FOUND");
  }
  if (!member.personId) {
    throw new OrgError("Este membro não possui pessoa vinculada", "NOT_LINKED");
  }

  const ctx = await getOrgContext(actor, member.organizationId);
  if (!ctx.canManagePeople) {
    throw new OrgError("Apenas owners e admins podem desvincular pessoas", "FORBIDDEN");
  }

  return prisma.organizationMember.update({ where: { id: member.id }, data: { personId: null } });
}
