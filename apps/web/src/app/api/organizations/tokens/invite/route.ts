import type { NextRequest } from "next/server";

import { handleApi, readJson, unauthorized } from "@/features/organizations/api/helpers";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { createMemberInviteToken } from "@/features/organizations/server/tokens";

export async function POST(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  const body = await readJson(request);
  const organizationId = typeof body.organizationId === "string" ? body.organizationId : "";

  return handleApi(async () => {
    const token = await createMemberInviteToken(actor, organizationId);
    return { code: token.code, expiresAt: token.expiresAt.toISOString() };
  });
}
