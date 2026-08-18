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

async function assertFamilyAvailable(
  organizationId: string,
  family: string | undefined,
  excludePersonId?: string,
): Promise<void> {
  if (!family) {
    return;
  }
  const existing = await prisma.person.findFirst({
    where: {
      organizationId,
      family: { equals: family, mode: "insensitive" },
      NOT: excludePersonId ? { id: excludePersonId } : undefined,
    },
    select: { id: true },
  });
  if (existing) {
    throw new OrgError("Já existe uma família com este nome na organização", "FAMILY_TAKEN");
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
    orderBy: [{ family: "asc" }, { name: "asc" }],
  });
}

export async function createPerson(ctx: OrgContext, raw: CreatePersonInput) {
  requireManage(ctx, "criar");
  const input = createPersonInput.parse(raw);
  requireSameOrganization(ctx, input.organizationId);
  await assertFamilyAvailable(ctx.organization.id, input.family);

  return prisma.person.create({
    data: {
      organizationId: ctx.organization.id,
      name: input.name,
      sex: input.sex,
      family: input.family ?? null,
      isHeadOfFamily: input.isHeadOfFamily,
      isYoung: input.isYoung,
      isStudent: input.isStudent,
      isBaptized: input.isBaptized,
      isActive: input.isActive,
      hasCleaning: input.hasCleaning,
      startingConversation: input.startingConversation,
      cultivatingInterest: input.cultivatingInterest,
      makingDisciples: input.makingDisciples,
      explainingBeliefs: input.explainingBeliefs,
      hasBestMinistrySpeech: input.hasBestMinistrySpeech,
      hasBibleReading: input.hasBibleReading,
      hasServicePrivileges: input.hasServicePrivileges,
      hasPrayer: input.hasPrayer,
      isElder: input.isElder,
      hasWhatWouldYouSay: input.hasWhatWouldYouSay,
      hasNVMCChairman: input.hasNVMCChairman,
      hasTreasuresSpeech: input.hasTreasuresSpeech,
      hasSpiritualGems: input.hasSpiritualGems,
      hasChristianLifeParts: input.hasChristianLifeParts,
      hasCongregationBibleStudy: input.hasCongregationBibleStudy,
      isBibleStudyReader: input.isBibleStudyReader,
      hasPublicMeetingChairman: input.hasPublicMeetingChairman,
      hasPublicTalk: input.hasPublicTalk,
      hasWatchtowerStudyConductor: input.hasWatchtowerStudyConductor,
      isWatchtowerStudyReader: input.isWatchtowerStudyReader,
    },
  });
}

export async function updatePerson(ctx: OrgContext, raw: UpdatePersonInput) {
  requireManage(ctx, "editar");
  const input = updatePersonInput.parse(raw);
  requireSameOrganization(ctx, input.organizationId);
  await assertFamilyAvailable(ctx.organization.id, input.family, input.personId);

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
      sex: input.sex,
      family: input.family ?? null,
      isHeadOfFamily: input.isHeadOfFamily,
      isYoung: input.isYoung,
      isStudent: input.isStudent,
      isBaptized: input.isBaptized,
      isActive: input.isActive,
      hasCleaning: input.hasCleaning,
      startingConversation: input.startingConversation,
      cultivatingInterest: input.cultivatingInterest,
      makingDisciples: input.makingDisciples,
      explainingBeliefs: input.explainingBeliefs,
      hasBestMinistrySpeech: input.hasBestMinistrySpeech,
      hasBibleReading: input.hasBibleReading,
      hasServicePrivileges: input.hasServicePrivileges,
      hasPrayer: input.hasPrayer,
      isElder: input.isElder,
      hasWhatWouldYouSay: input.hasWhatWouldYouSay,
      hasNVMCChairman: input.hasNVMCChairman,
      hasTreasuresSpeech: input.hasTreasuresSpeech,
      hasSpiritualGems: input.hasSpiritualGems,
      hasChristianLifeParts: input.hasChristianLifeParts,
      hasCongregationBibleStudy: input.hasCongregationBibleStudy,
      isBibleStudyReader: input.isBibleStudyReader,
      hasPublicMeetingChairman: input.hasPublicMeetingChairman,
      hasPublicTalk: input.hasPublicTalk,
      hasWatchtowerStudyConductor: input.hasWatchtowerStudyConductor,
      isWatchtowerStudyReader: input.isWatchtowerStudyReader,
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
