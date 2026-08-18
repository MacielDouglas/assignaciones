import { InviteTokenType } from "@/generated/prisma/enums";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { getUserMembership } from "@/lib/organizations";
import { getFamilyNameFromPersonName, normalizePersonFields } from "@/lib/person-rules";
import { prisma } from "@/lib/prisma";
import { canManageTokens } from "@/lib/roles";
import { createInviteTokenSchema } from "@/lib/schemas";
import { getSessionUser } from "@/lib/session";
import {
  formatTokenCode,
  generateTokenCode,
  hashTokenCode,
  isTokenExpired,
  isTokenUsed,
  TOKEN_TTL_MS,
} from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError(400, "Corpo inválido.");

    const type = body.type;

    if (type === InviteTokenType.ORGANIZATION_CREATE) {
      if (!user.isSubUser) {
        return jsonError(403, "Apenas o sub-user pode criar tokens de organização.");
      }
    } else if (type === InviteTokenType.MEMBER_INVITE) {
      const membership = await getUserMembership(user.id);
      if (!membership || !canManageTokens(membership.role)) {
        return jsonError(403, "Apenas owners podem convidar membros.");
      }

      const parsed = createInviteTokenSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
      }

      const { personId, personName, personSexo, familyId, newFamilyName } = parsed.data;

      let person: { id: string; nome: string; sexo: string };

      if (personId) {
        const existing = await prisma.person.findFirst({
          where: { id: personId, organizationId: membership.organizationId },
          include: {
            member: { select: { id: true } },
            inviteToken: { select: { id: true } },
          },
        });

        if (!existing) {
          return jsonError(400, "Pessoa não encontrada nesta organização.");
        }
        if (existing.member) {
          return jsonError(400, "Esta pessoa já está vinculada a um usuário.");
        }
        if (existing.inviteToken) {
          return jsonError(400, "Esta pessoa já possui um token de convite.");
        }

        person = { id: existing.id, nome: existing.nome, sexo: existing.sexo };
      } else {
        if (!personName || !personSexo) {
          return jsonError(400, "Informe os dados da nova pessoa.");
        }

        let family = familyId
          ? await prisma.family.findFirst({
              where: { id: familyId, organizationId: membership.organizationId },
            })
          : null;

        if (familyId && !family) {
          return jsonError(400, "Família não encontrada nesta organização.");
        }

        if (!family) {
          const familyName = newFamilyName || getFamilyNameFromPersonName(personName);
          family = await prisma.family.create({
            data: { name: familyName, organizationId: membership.organizationId },
          });
        }

        const created = await prisma.person.create({
          data: normalizePersonFields({
            nome: personName,
            sexo: personSexo,
            familiaId: family.id,
            organizationId: membership.organizationId,
            jovem: false,
            estudante: true,
            batizado: false,
            ativo: true,
            limpeza: true,
            casado: false,
          }),
        });

        person = { id: created.id, nome: created.nome, sexo: created.sexo };
      }

      const code = generateTokenCode();
      const token = await prisma.inviteToken.create({
        data: {
          codeHash: hashTokenCode(code),
          type: InviteTokenType.MEMBER_INVITE,
          organizationId: membership.organizationId,
          createdById: user.id,
          personId: person.id,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });

      return jsonOk(
        {
          id: token.id,
          token: formatTokenCode(code),
          type: token.type,
          person: { id: person.id, nome: person.nome, sexo: person.sexo },
        },
        201,
      );
    }

    const code = generateTokenCode();
    const token = await prisma.inviteToken.create({
      data: {
        codeHash: hashTokenCode(code),
        type: InviteTokenType.ORGANIZATION_CREATE,
        createdById: user.id,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    return jsonOk(
      {
        id: token.id,
        token: formatTokenCode(code),
        type: token.type,
      },
      201,
    );
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    if (user.isSubUser) {
      const tokens = await prisma.inviteToken.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          organization: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          usedBy: { select: { id: true, name: true, email: true } },
          person: { select: { id: true, nome: true } },
        },
      });

      return jsonOk(
        tokens.map((token) => ({
          id: token.id,
          type: token.type,
          status: isTokenUsed(token.usedAt)
            ? ("USED" as const)
            : isTokenExpired(token.expiresAt)
              ? ("EXPIRED" as const)
              : ("ACTIVE" as const),
          expiresAt: token.expiresAt,
          usedAt: token.usedAt,
          createdAt: token.createdAt,
          organization: token.organization,
          createdBy: token.createdBy,
          usedBy: token.usedBy,
          person: token.person,
        })),
      );
    }

    const membership = await getUserMembership(user.id);
    if (!membership || !canManageTokens(membership.role)) {
      return jsonError(403, "Apenas owners e sub-user podem ver tokens.");
    }

    const tokens = await prisma.inviteToken.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        usedBy: { select: { id: true, name: true, email: true } },
        person: { select: { id: true, nome: true } },
      },
    });

    return jsonOk(
      tokens.map((token) => ({
        id: token.id,
        type: token.type,
        status: isTokenUsed(token.usedAt)
          ? ("USED" as const)
          : isTokenExpired(token.expiresAt)
            ? ("EXPIRED" as const)
            : ("ACTIVE" as const),
        expiresAt: token.expiresAt,
        usedAt: token.usedAt,
        createdAt: token.createdAt,
        usedBy: token.usedBy,
        person: token.person,
      })),
    );
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
