import { updateMemberRoleSchema } from "@/features/members/schemas";
import { MemberRole } from "@/generated/prisma/enums";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { canPromoteTo } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/members/[memberId]">,
) {
  try {
    const { id, memberId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const body = await request.json().catch(() => null);
    const parsed = updateMemberRoleSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const target = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: id },
    });
    if (!target) return jsonError(404, "Membro não encontrado.");

    if (membership.role !== "OWNER") {
      if (
        !canPromoteTo(membership.role, target.role) ||
        !canPromoteTo(membership.role, parsed.data.role)
      ) {
        return jsonError(403, "Admins só podem promover ou rebaixar admins e membros.");
      }
      if (target.role === MemberRole.OWNER) {
        return jsonError(403, "Apenas owners podem alterar a função de um owner.");
      }
    }

    if (
      parsed.data.role !== MemberRole.OWNER &&
      membership.role === MemberRole.OWNER &&
      target.role === MemberRole.OWNER
    ) {
      const ownerCount = await prisma.organizationMember.count({
        where: { organizationId: id, role: MemberRole.OWNER },
      });
      if (ownerCount <= 1) {
        return jsonError(400, "A organização precisa de pelo menos um owner.");
      }
    }

    const member = await prisma.organizationMember.update({
      where: { id: target.id },
      data: { role: parsed.data.role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return jsonOk({ member });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
