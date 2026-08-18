import { InviteTokenType, MemberRole } from "@/generated/prisma/enums";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { joinOrganizationSchema } from "@/lib/schemas";
import { getSessionUser } from "@/lib/session";
import { hashTokenCode, isTokenExpired, isTokenUsed } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const body = await request.json().catch(() => null);
    const parsed = joinOrganizationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const { token: code } = parsed.data;

    if (!user.isSubUser) {
      const existing = await prisma.organizationMember.findUnique({ where: { userId: user.id } });
      if (existing) {
        return jsonError(400, "Você já pertence a uma organização.");
      }
    }

    const inviteToken = await prisma.inviteToken.findUnique({
      where: { codeHash: hashTokenCode(code) },
      include: { organization: true, person: true },
    });

    if (!inviteToken) return jsonError(400, "Token inválido.");
    if (inviteToken.type !== InviteTokenType.MEMBER_INVITE) {
      return jsonError(400, "Este token não permite entrar em uma organização.");
    }
    if (isTokenUsed(inviteToken.usedAt)) return jsonError(400, "Token já utilizado.");
    if (isTokenExpired(inviteToken.expiresAt)) return jsonError(400, "Token expirado.");
    if (!inviteToken.organization) return jsonError(400, "Token inválido.");
    if (!inviteToken.person) return jsonError(400, "Token sem pessoa vinculada.");

    const organizationId = inviteToken.organization.id;

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.organizationMember.create({
        data: {
          organizationId,
          userId: user.id,
          role: MemberRole.MEMBER,
          personId: inviteToken.personId,
        },
      });

      await tx.inviteToken.update({
        where: { id: inviteToken.id },
        data: { usedById: user.id, usedAt: new Date() },
      });

      return member;
    });

    return jsonOk({
      organization: { id: inviteToken.organization.id, name: inviteToken.organization.name },
      person: { id: inviteToken.person.id, nome: inviteToken.person.nome },
      role: result.role,
    });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
