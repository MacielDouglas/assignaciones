import {
  type CreatePersonInput,
  createPersonInput,
  type DeletePersonInput,
  deletePersonInput,
  type UpdatePersonInput,
  updatePersonInput,
} from "@asignaciones/shared";

import { prisma } from "@/lib/db";

import type { OrgContext } from "./context";
import { OrgError } from "./errors";

function requireManage(ctx: OrgContext, action: string): void {
  if (!ctx.canManagePeople) {
    throw new OrgError(`Apenas owners e admins podem ${action} pessoas`, "FORBIDDEN");
  }
}

function requireSameOrganization(ctx: OrgContext, organizationId: string): void {
  if (organizationId !== ctx.organization.id) {
    throw new OrgError("Organização inválida", "ORG_MISMATCH");
  }
}

export async function listPeople(ctx: OrgContext) {
  requireManage(ctx, "ver");

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

export async function createPerson(ctx: OrgContext, raw: CreatePersonInput) {
  requireManage(ctx, "criar");
  const input = createPersonInput.parse(raw);
  requireSameOrganization(ctx, input.organizationId);

  return prisma.person.create({
    data: {
      organizationId: ctx.organization.id,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
    },
  });
}

export async function updatePerson(ctx: OrgContext, raw: UpdatePersonInput) {
  requireManage(ctx, "editar");
  const input = updatePersonInput.parse(raw);
  requireSameOrganization(ctx, input.organizationId);

  const existing = await prisma.person.findFirst({
    where: { id: input.personId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!existing) {
    throw new OrgError("Pessoa não encontrada", "PERSON_NOT_FOUND");
  }

  return prisma.person.update({
    where: { id: input.personId },
    data: {
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
    },
  });
}

export async function deletePerson(ctx: OrgContext, raw: DeletePersonInput) {
  requireManage(ctx, "excluir");
  const input = deletePersonInput.parse(raw);
  requireSameOrganization(ctx, input.organizationId);

  const existing = await prisma.person.findFirst({
    where: { id: input.personId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!existing) {
    throw new OrgError("Pessoa não encontrada", "PERSON_NOT_FOUND");
  }

  await prisma.person.delete({ where: { id: input.personId } });
}
