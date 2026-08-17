import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { AUTH_MESSAGE, OrgError } from "./errors";

export type Actor = {
  userId: string;
  name: string | null;
  email: string | null;
  isSubUser: boolean;
};

export function isSubUserEmail(email?: string | null): boolean {
  const superEmail = process.env.SUPER_USER_EMAIL;
  if (!superEmail || !email) {
    return false;
  }
  return email.toLowerCase() === superEmail.toLowerCase();
}

export async function getActorFromHeaders(headers: Headers): Promise<Actor | null> {
  const session = await auth.api.getSession({ headers });
  const user = session?.user;

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    isSubUser: isSubUserEmail(user.email),
  };
}

export async function requireActor(headers: Headers): Promise<Actor> {
  const actor = await getActorFromHeaders(headers);
  if (!actor) {
    throw new OrgError(AUTH_MESSAGE, "UNAUTHENTICATED");
  }
  return actor;
}

export async function getMembership(actor: Actor) {
  return prisma.organizationMember.findUnique({
    where: { userId: actor.userId },
    include: { organization: true, person: true },
  });
}

export function requireOwnerRole(role: MemberRole): void {
  if (role !== "OWNER") {
    throw new OrgError("Apenas owners podem realizar esta ação", "FORBIDDEN");
  }
}

export function requireManagerRole(role: MemberRole): void {
  if (role !== "OWNER" && role !== "ADMIN") {
    throw new OrgError("Apenas owners e admins podem realizar esta ação", "FORBIDDEN");
  }
}
