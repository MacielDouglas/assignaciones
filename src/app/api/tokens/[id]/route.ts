import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { getUserMembership } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { canManageTokens } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";
import { isTokenUsed, TOKEN_TTL_MS } from "@/lib/tokens";

async function assertCanManageToken(tokenId: string, userId: string, subUser: boolean) {
  const token = await prisma.inviteToken.findUnique({ where: { id: tokenId } });
  if (!token) return { token: null as null, error: jsonError(404, "Token não encontrado.") };

  if (subUser) return { token, error: null };

  const membership = await getUserMembership(userId);
  if (
    !membership ||
    !canManageTokens(membership.role) ||
    membership.organizationId !== token.organizationId
  ) {
    return {
      token: null,
      error: jsonError(403, "Você não tem permissão para gerenciar este token."),
    };
  }

  return { token, error: null };
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/tokens/[id]">) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const { token, error } = await assertCanManageToken(id, user.id, user.isSubUser);
    if (error || !token) return error ?? jsonError(404, "Token não encontrado.");

    if (isTokenUsed(token.usedAt)) {
      return jsonError(400, "Não é possível renovar um token já usado.");
    }

    const renewed = await prisma.inviteToken.update({
      where: { id: token.id },
      data: { expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
      select: { id: true, expiresAt: true },
    });

    return jsonOk({ id: renewed.id, expiresAt: renewed.expiresAt });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/tokens/[id]">) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const { token, error } = await assertCanManageToken(id, user.id, user.isSubUser);
    if (error || !token) return error ?? jsonError(404, "Token não encontrado.");

    await prisma.inviteToken.delete({ where: { id: token.id } });

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
