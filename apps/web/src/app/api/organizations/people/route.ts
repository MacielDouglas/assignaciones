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

function personPayload(body: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    ...extra,
    name: typeof body.name === "string" ? body.name : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
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
