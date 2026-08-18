import { InviteTokenType, MemberRole } from "@/generated/prisma/enums";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { getFamilyNameFromPersonName } from "@/lib/person-rules";
import { prisma } from "@/lib/prisma";
import { createOrganizationSchema } from "@/lib/schemas";
import { getSessionUser } from "@/lib/session";
import { hashTokenCode, isTokenExpired, isTokenUsed } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const body = await request.json().catch(() => null);
    const parsed = createOrganizationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const { token: code, organizationName, personName, personSexo } = parsed.data;

    if (!user.isSubUser) {
      const existing = await prisma.organizationMember.findUnique({ where: { userId: user.id } });
      if (existing) {
        return jsonError(400, "Você já pertence a uma organização.");
      }
    }

    const inviteToken = await prisma.inviteToken.findUnique({
      where: { codeHash: hashTokenCode(code) },
    });

    if (!inviteToken) return jsonError(400, "Token inválido.");
    if (inviteToken.type !== InviteTokenType.ORGANIZATION_CREATE) {
      return jsonError(400, "Este token não permite criar organizações.");
    }
    if (isTokenUsed(inviteToken.usedAt)) return jsonError(400, "Token já utilizado.");
    if (isTokenExpired(inviteToken.expiresAt)) return jsonError(400, "Token expirado.");

    const result = await prisma.$transaction(async (tx) => {
      const familyName = getFamilyNameFromPersonName(personName);

      const organization = await tx.organization.create({ data: { name: organizationName } });

      const family = await tx.family.create({
        data: { name: familyName, organizationId: organization.id },
      });

      const person = await tx.person.create({
        data: {
          nome: personName,
          sexo: personSexo,
          familiaId: family.id,
          organizationId: organization.id,
          jovem: false,
          estudante: true,
          batizado: false,
          ativo: true,
          limpeza: true,
          casado: false,
        },
      });

      const member = await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: MemberRole.OWNER,
          personId: person.id,
        },
      });

      await tx.inviteToken.update({
        where: { id: inviteToken.id },
        data: { usedById: user.id, usedAt: new Date() },
      });

      return { organization, family, person, member };
    });

    return jsonOk(
      {
        organization: { id: result.organization.id, name: result.organization.name },
        family: { id: result.family.id, name: result.family.name },
        person: { id: result.person.id, nome: result.person.nome },
        role: result.member.role,
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
      const organizations = await prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { members: true, persons: true, families: true } },
        },
      });

      return jsonOk(organizations);
    }

    const membership = await prisma.organizationMember.findUnique({
      where: { userId: user.id },
      include: {
        organization: {
          include: { _count: { select: { members: true, persons: true, families: true } } },
        },
      },
    });

    if (!membership) return jsonOk({ organization: null });

    return jsonOk({
      organization: membership.organization,
      role: membership.role,
      personId: membership.personId,
    });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
