"use server";

import {
  createPersonInput,
  linkPersonToMemberInput,
  redeemMemberInviteInput,
  redeemOrganizationCreateInput,
  unlinkPersonInput,
  updateMemberRoleInput,
} from "@asignaciones/shared";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ZodError } from "zod";

import { requireActor } from "./access";
import { OrgError } from "./errors";
import { linkPersonToMember, unlinkPersonFromMember, updateMemberRole } from "./members";
import { createPerson } from "./people";
import {
  createMemberInviteToken,
  createOrganizationCreateToken,
  deleteToken,
  redeemToken,
} from "./tokens";

export type ActionState<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<ActionState<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof OrgError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof ZodError) {
      return { ok: false, error: error.errors[0]?.message ?? "Dados inválidos" };
    }
    return { ok: false, error: "Erro inesperado. Tente novamente." };
  }
}

async function actorFromRequest() {
  return requireActor(await headers());
}

export async function createOrganizationTokenAction(): Promise<
  ActionState<{ code: string; expiresAt: string }>
> {
  return run(async () => {
    const actor = await actorFromRequest();
    const token = await createOrganizationCreateToken(actor);
    revalidatePath("/dashboard");
    return { code: token.code, expiresAt: token.expiresAt.toISOString() };
  });
}

export async function createMemberInviteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState<{ code: string; expiresAt: string }>> {
  return run(async () => {
    const actor = await actorFromRequest();
    const orgId = formData.get("organizationId");
    if (typeof orgId !== "string" || !orgId) {
      throw new OrgError("Organização inválida", "ORG_REQUIRED");
    }
    const token = await createMemberInviteToken(actor, orgId);
    revalidatePath("/members");
    return { code: token.code, expiresAt: token.expiresAt.toISOString() };
  });
}

export async function redeemOrganizationCreateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState<{ organizationId: string; role: "OWNER" | "MEMBER" }>> {
  return run(async () => {
    const actor = await actorFromRequest();
    const input = redeemOrganizationCreateInput.parse({
      code: formData.get("code"),
      name: formData.get("name"),
    });
    const result = await redeemToken(actor, { code: input.code, name: input.name });
    revalidatePath("/dashboard");
    return result;
  });
}

export async function redeemMemberInviteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState<{ organizationId: string; role: "OWNER" | "MEMBER" }>> {
  return run(async () => {
    const actor = await actorFromRequest();
    const input = redeemMemberInviteInput.parse({ code: formData.get("code") });
    const result = await redeemToken(actor, { code: input.code });
    revalidatePath("/dashboard");
    return result;
  });
}

export async function updateMemberRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState<{ memberId: string }>> {
  return run(async () => {
    const actor = await actorFromRequest();
    const input = updateMemberRoleInput.parse({
      memberId: formData.get("memberId"),
      role: formData.get("role"),
    });
    await updateMemberRole(actor, input.memberId, input.role);
    revalidatePath("/members");
    return { memberId: input.memberId };
  });
}

export async function linkPersonToMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState<{ memberId: string }>> {
  return run(async () => {
    const actor = await actorFromRequest();
    const input = linkPersonToMemberInput.parse({
      memberId: formData.get("memberId"),
      personId: formData.get("personId"),
    });
    await linkPersonToMember(actor, input.memberId, input.personId);
    revalidatePath("/members");
    revalidatePath("/people");
    return { memberId: input.memberId };
  });
}

export async function unlinkPersonFromMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState<{ memberId: string }>> {
  return run(async () => {
    const actor = await actorFromRequest();
    const input = unlinkPersonInput.parse({ memberId: formData.get("memberId") });
    await unlinkPersonFromMember(actor, input.memberId);
    revalidatePath("/members");
    revalidatePath("/people");
    return { memberId: input.memberId };
  });
}

export async function deleteTokenAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState<{ tokenId: string }>> {
  return run(async () => {
    const actor = await actorFromRequest();
    const tokenId = formData.get("tokenId");
    if (typeof tokenId !== "string" || !tokenId) {
      throw new OrgError("Token inválido", "TOKEN_NOT_FOUND");
    }
    await deleteToken(actor, tokenId);
    revalidatePath("/tokens");
    return { tokenId };
  });
}

export async function createPersonAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState<{ personId: string }>> {
  return run(async () => {
    const actor = await actorFromRequest();
    const input = createPersonInput.parse({
      organizationId: formData.get("organizationId"),
      name: formData.get("name"),
      email: formData.get("email") || undefined,
      phone: formData.get("phone") || undefined,
    });
    const person = await createPerson(actor, input);
    revalidatePath("/people");
    return { personId: person.id };
  });
}
