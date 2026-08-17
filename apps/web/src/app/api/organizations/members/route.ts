import { memberRoleSchema } from "@asignaciones/shared";
import type { NextRequest } from "next/server";

import { apiError, handleApi, readJson, unauthorized } from "@/features/organizations/api/helpers";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { listMembers, updateMemberRole } from "@/features/organizations/server/members";

export async function GET(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  const orgId = request.nextUrl.searchParams.get("orgId") ?? undefined;

  return handleApi(async () => {
    const members = await listMembers(actor, orgId);
    return {
      organizationId: members[0]?.organizationId ?? orgId ?? null,
      members: members.map((member) => ({
        id: member.id,
        organizationId: member.organizationId,
        role: member.role,
        personId: member.personId,
        person: member.person ? { id: member.person.id, name: member.person.name } : null,
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
        },
      })),
    };
  });
}

export async function PATCH(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  const body = await readJson(request);
  const roleResult = memberRoleSchema.safeParse(body.role);
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  if (!roleResult.success || !memberId) {
    return apiError("Dados inválidos");
  }

  return handleApi(async () => {
    await updateMemberRole(actor, memberId, roleResult.data);
    return { memberId };
  });
}
