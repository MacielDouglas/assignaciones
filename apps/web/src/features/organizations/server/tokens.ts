import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from "node:crypto";

import { prisma } from "@/lib/db";

import type { Actor } from "./access";
import { getOrgContext } from "./context";
import { OrgError } from "./errors";

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TOKEN_LENGTH = 8;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function encryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new OrgError("Segredo de autenticação não configurado", "CONFIG_ERROR");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptTokenCode(code: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptTokenCode(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

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

export type TokenListEntry = {
  id: string;
  code: string | null;
  type: "ORGANIZATION_CREATE" | "MEMBER_INVITE";
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
  usedBy: { name: string | null; email: string | null } | null;
  organization: { id: string; name: string } | null;
};

export async function listCreatedTokens(actor: Actor): Promise<TokenListEntry[]> {
  if (!actor.isSubUser) {
    throw new OrgError("Apenas o sub-user pode ver os tokens gerados", "FORBIDDEN");
  }

  const tokens = await prisma.inviteToken.findMany({
    where: { createdById: actor.userId },
    include: {
      usedBy: { select: { name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return tokens.map((token) => ({
    id: token.id,
    code: token.codeEncrypted ? decryptTokenCode(token.codeEncrypted) : null,
    type: token.type,
    createdAt: token.createdAt,
    expiresAt: token.expiresAt,
    usedAt: token.usedAt,
    usedBy: token.usedBy,
    organization: token.organization,
  }));
}

export async function deleteToken(actor: Actor, tokenId: string): Promise<void> {
  if (!actor.isSubUser) {
    throw new OrgError("Apenas o sub-user pode apagar tokens", "FORBIDDEN");
  }

  const token = await prisma.inviteToken.findFirst({
    where: { id: tokenId, createdById: actor.userId },
  });
  if (!token) {
    throw new OrgError("Token não encontrado", "TOKEN_NOT_FOUND");
  }
  if (token.usedAt) {
    throw new OrgError("Tokens usados não podem ser apagados", "TOKEN_USED");
  }

  await prisma.inviteToken.delete({ where: { id: token.id } });
}

export async function createOrganizationCreateToken(actor: Actor): Promise<TokenResult> {
  if (!actor.isSubUser) {
    throw new OrgError("Apenas o sub-user pode criar tokens de organização", "FORBIDDEN");
  }

  const code = generateTokenCode();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.inviteToken.create({
    data: {
      codeHash: hashTokenCode(code),
      codeEncrypted: encryptTokenCode(code),
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
      codeEncrypted: encryptTokenCode(code),
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
      await tx.inviteToken.update({
        where: { id: token.id },
        data: { organizationId: org.id },
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
