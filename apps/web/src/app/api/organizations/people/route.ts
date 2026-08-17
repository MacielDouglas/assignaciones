import { createPersonInput } from "@asignaciones/shared";
import type { NextRequest } from "next/server";

import { apiError, handleApi, readJson, unauthorized } from "@/features/organizations/api/helpers";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { createPerson, listPeople } from "@/features/organizations/server/people";

export async function GET(request: NextRequest) {
  const actor = await getActorFromHeaders(request.headers);
  if (!actor) {
    return unauthorized();
  }

  const orgId = request.nextUrl.searchParams.get("orgId") ?? undefined;

  return handleApi(async () => {
    const people = await listPeople(actor, orgId);
    return {
      organizationId: people[0]?.organizationId ?? orgId ?? null,
      people: people.map((person) => ({
        id: person.id,
        organizationId: person.organizationId,
        name: person.name,
        email: person.email,
        phone: person.phone,
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
      })),
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
    name: body.name,
    email: typeof body.email === "string" ? body.email : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
  });
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
  }

  return handleApi(async () => {
    const person = await createPerson(actor, parsed.data);
    return { personId: person.id };
  });
}
