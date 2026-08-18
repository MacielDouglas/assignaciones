import { createPersonInput, deletePersonInput, updatePersonInput } from "@asignaciones/shared";
import type { NextRequest } from "next/server";

import { apiError, handleApi, readJson, unauthorized } from "@/features/organizations/api/helpers";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { getOrgContext } from "@/features/organizations/server/context";
import {
  createPerson,
  deletePerson,
  listPeople,
  updatePerson,
} from "@/features/organizations/server/people";

function orgIdFrom(request: NextRequest): string | undefined {
  return request.nextUrl.searchParams.get("orgId") ?? undefined;
}

const BOOLEAN_FIELDS = [
  "isHeadOfFamily",
  "isYoung",
  "isStudent",
  "isBaptized",
  "isActive",
  "hasCleaning",
  "startingConversation",
  "cultivatingInterest",
  "makingDisciples",
  "explainingBeliefs",
  "hasBestMinistrySpeech",
  "hasBibleReading",
  "hasServicePrivileges",
  "hasPrayer",
  "isElder",
  "hasWhatWouldYouSay",
  "hasNVMCChairman",
  "hasTreasuresSpeech",
  "hasSpiritualGems",
  "hasChristianLifeParts",
  "hasCongregationBibleStudy",
  "isBibleStudyReader",
  "hasPublicMeetingChairman",
  "hasPublicTalk",
  "hasWatchtowerStudyConductor",
  "isWatchtowerStudyReader",
] as const;

function personPayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {
    name: typeof body.name === "string" ? body.name : undefined,
    sex: body.sex,
    family: typeof body.family === "string" ? body.family : undefined,
  };
  for (const field of BOOLEAN_FIELDS) {
    payload[field] = typeof body[field] === "boolean" ? body[field] : undefined;
  }
  return payload;
}

function serializePerson(person: Awaited<ReturnType<typeof listPeople>>[number]) {
  return {
    id: person.id,
    organizationId: person.organizationId,
    name: person.name,
    sex: person.sex,
    family: person.family,
    isHeadOfFamily: person.isHeadOfFamily,
    isYoung: person.isYoung,
    isStudent: person.isStudent,
    isBaptized: person.isBaptized,
    isActive: person.isActive,
    hasCleaning: person.hasCleaning,
    startingConversation: person.startingConversation,
    cultivatingInterest: person.cultivatingInterest,
    makingDisciples: person.makingDisciples,
    explainingBeliefs: person.explainingBeliefs,
    hasBestMinistrySpeech: person.hasBestMinistrySpeech,
    hasBibleReading: person.hasBibleReading,
    hasServicePrivileges: person.hasServicePrivileges,
    hasPrayer: person.hasPrayer,
    isElder: person.isElder,
    hasWhatWouldYouSay: person.hasWhatWouldYouSay,
    hasNVMCChairman: person.hasNVMCChairman,
    hasTreasuresSpeech: person.hasTreasuresSpeech,
    hasSpiritualGems: person.hasSpiritualGems,
    hasChristianLifeParts: person.hasChristianLifeParts,
    hasCongregationBibleStudy: person.hasCongregationBibleStudy,
    isBibleStudyReader: person.isBibleStudyReader,
    hasPublicMeetingChairman: person.hasPublicMeetingChairman,
    hasPublicTalk: person.hasPublicTalk,
    hasWatchtowerStudyConductor: person.hasWatchtowerStudyConductor,
    isWatchtowerStudyReader: person.isWatchtowerStudyReader,
    member: person.member
      ? {
          id: person.member.id,
          user: {
            id: person.member.user.id,
            name: person.member.user.name,
            email: person.member.user.email,
          },
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  return handleApi(async () => {
    const ctx = await getOrgContext(actor, orgIdFrom(request));
    const people = await listPeople(ctx);
    return {
      organizationId: ctx.organization.id,
      people: people.map(serializePerson),
    };
  });
}

export async function POST(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  const body = await readJson(request);
  const parsed = createPersonInput.safeParse({
    organizationId: body.organizationId,
    ...personPayload(body),
  });
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
  }

  return handleApi(async () => {
    const ctx = await getOrgContext(actor, parsed.data.organizationId);
    const person = await createPerson(ctx, parsed.data);
    return { personId: person.id };
  });
}

export async function PATCH(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  const body = await readJson(request);
  const parsed = updatePersonInput.safeParse({
    organizationId: body.organizationId,
    personId: body.personId,
    ...personPayload(body),
  });
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
  }

  return handleApi(async () => {
    const ctx = await getOrgContext(actor, parsed.data.organizationId);
    const person = await updatePerson(ctx, parsed.data);
    return { personId: person.id };
  });
}

export async function DELETE(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  const body = await readJson(request);
  const parsed = deletePersonInput.safeParse({
    organizationId: body.organizationId,
    personId: body.personId,
  });
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
  }

  return handleApi(async () => {
    const ctx = await getOrgContext(actor, parsed.data.organizationId);
    await deletePerson(ctx, parsed.data);
    return { personId: parsed.data.personId };
  });
}
