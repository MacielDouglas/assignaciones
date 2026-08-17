import type { NextRequest } from "next/server";

import { apiError, handleApi, readJson, unauthorized } from "@/features/organizations/api/helpers";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import {
  linkPersonToMember,
  unlinkPersonFromMember,
} from "@/features/organizations/server/members";

export async function POST(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  const body = await readJson(request);
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  const personId = typeof body.personId === "string" ? body.personId : "";
  if (!memberId || !personId) {
    return apiError("Dados inválidos");
  }

  return handleApi(async () => {
    await linkPersonToMember(actor, memberId, personId);
    return { memberId };
  });
}

export async function DELETE(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  const body = await readJson(request);
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  if (!memberId) {
    return apiError("Dados inválidos");
  }

  return handleApi(async () => {
    await unlinkPersonFromMember(actor, memberId);
    return { memberId };
  });
}
