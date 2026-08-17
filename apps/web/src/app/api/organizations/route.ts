import { organizationNameSchema, tokenCodeSchema } from "@asignaciones/shared";
import type { NextRequest } from "next/server";

import { apiError, handleApi, readJson, unauthorized } from "@/features/organizations/api/helpers";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { getCurrentContext } from "@/features/organizations/server/context";
import { redeemToken } from "@/features/organizations/server/tokens";

export async function GET(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  return handleApi(async () => {
    const context = await getCurrentContext(actor);

    if (context.kind === "sub-user") {
      return {
        isSubUser: true,
        membership: null,
        organizations: context.organizations.map((org) => ({
          id: org.id,
          name: org.name,
          createdAt: org.createdAt.toISOString(),
          memberCount: org.memberCount,
          personCount: org.personCount,
        })),
      };
    }

    if (context.kind === "none") {
      return { isSubUser: false, membership: null, organizations: [] };
    }

    return {
      isSubUser: false,
      membership: {
        id: context.membership.id,
        role: context.membership.role,
        organization: {
          id: context.membership.organizationId,
          name: context.membership.organization.name,
        },
        person: context.membership.person
          ? { id: context.membership.person.id, name: context.membership.person.name }
          : null,
      },
      organizations: [],
    };
  });
}

export async function POST(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  const body = await readJson(request);

  const codeResult = tokenCodeSchema.safeParse(body.code);
  if (!codeResult.success) {
    return apiError(codeResult.error.errors[0]?.message ?? "Token inválido");
  }

  let name: string | undefined;
  if (typeof body.name === "string" && body.name.trim() !== "") {
    const nameResult = organizationNameSchema.safeParse(body.name);
    if (!nameResult.success) {
      return apiError(nameResult.error.errors[0]?.message ?? "Nome inválido");
    }
    name = nameResult.data;
  }

  return handleApi(async () => {
    const result = await redeemToken(actor, { code: codeResult.data, name });
    return result;
  });
}
