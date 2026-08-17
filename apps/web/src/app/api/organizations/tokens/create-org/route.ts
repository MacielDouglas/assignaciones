import type { NextRequest } from "next/server";

import { handleApi, unauthorized } from "@/features/organizations/api/helpers";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { createOrganizationCreateToken } from "@/features/organizations/server/tokens";

export async function POST(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  return handleApi(async () => {
    const token = await createOrganizationCreateToken(actor);
    return { code: token.code, expiresAt: token.expiresAt.toISOString() };
  });
}
