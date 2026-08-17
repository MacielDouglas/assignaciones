import { createHash, randomInt } from "node:crypto";

import { prisma } from "@/lib/db";

import type { Actor } from "./access";
import { getOrgContext } from "./context";
import { OrgError } from "./errors";

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TOKEN_LENGTH = 8;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function generateTokenCode(): string {
  let code = "";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    code += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
  }
  return code;
}

export function hashTokenCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export type TokenResult = {
  code: string;
  expiresAt: Date;
};

export async function createOrganizationCreateToken(actor: Actor): Promise<TokenResult> {
  if (!actor.isSubUser) {
    throw new OrgError("Apenas o sub-user pode criar tokens de organização", "FORBIDDEN");
  }

  const code = generateTokenCode();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.inviteToken.create({
    data: {
      codeHash: hashTokenCode(code),
      type: "ORGANIZATION_CREATE",
      createdById: actor.userId,
      expiresAt,
    },
  });

  return { code, expiresAt };
}

export async function createMemberInviteToken(
  actor: Actor,
  organizationId: string,
): Promise<TokenResult> {
  const ctx = await getOrgContext(actor, organizationId);
  if (!ctx.canInvite) {
    throw new OrgError("Apenas owners podem convidar usuários", "FORBIDDEN");
  }

  const code = generateTokenCode();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.inviteToken.create({
    data: {
      codeHash: hashTokenCode(code),
      type: "MEMBER_INVITE",
      organizationId: ctx.organization.id,
      createdById: actor.userId,
      expiresAt,
    },
  });

  return { code, expiresAt };
}

export async function redeemToken(
  actor: Actor,
  input: { code: string; name?: string },
): Promise<{ organizationId: string; role: "OWNER" | "MEMBER" }> {
  if (actor.isSubUser) {
    throw new OrgError(
      "O sub-user administra de fora e não participa de organizações",
      "FORBIDDEN",
    );
  }

  const existing = await prisma.organizationMember.findUnique({ where: { userId: actor.userId } });
  if (existing) {
    throw new OrgError("Você já pertence a uma organização", "ALREADY_MEMBER");
  }

  const token = await prisma.inviteToken.findUnique({
    where: { codeHash: hashTokenCode(input.code) },
  });
  if (!token) {
    throw new OrgError("Token inválido", "TOKEN_NOT_FOUND");
  }
  if (token.usedAt) {
    throw new OrgError("Este token já foi utilizado", "TOKEN_USED");
  }
  if (token.expiresAt < new Date()) {
    throw new OrgError("Este token expirou", "TOKEN_EXPIRED");
  }

  if (token.type === "ORGANIZATION_CREATE") {
    const orgName = input.name?.trim();
    if (!orgName) {
      throw new OrgError("Informe o nome da organização", "NAME_REQUIRED");
    }
  }

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.inviteToken.updateMany({
      where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date(), usedById: actor.userId },
    });

    if (claimed.count === 0) {
      throw new OrgError("Este token já foi utilizado ou expirou", "TOKEN_UNAVAILABLE");
    }

    if (token.type === "ORGANIZATION_CREATE") {
      const orgName = input.name?.trim();
      if (!orgName) {
        throw new OrgError("Informe o nome da organização", "NAME_REQUIRED");
      }

      const org = await tx.organization.create({ data: { name: orgName } });
      const person = await tx.person.create({
        data: { name: actor.name?.trim() || "Sem nome", organizationId: org.id },
      });
      await tx.organizationMember.create({
        data: { organizationId: org.id, userId: actor.userId, role: "OWNER", personId: person.id },
      });
      return { organizationId: org.id, role: "OWNER" as const };
    }

    const organizationId = token.organizationId;
    if (!organizationId) {
      throw new OrgError("Token inválido", "TOKEN_NOT_FOUND");
    }

    await tx.organizationMember.create({
      data: { organizationId, userId: actor.userId, role: "MEMBER" },
    });
    return { organizationId, role: "MEMBER" as const };
  });
}
