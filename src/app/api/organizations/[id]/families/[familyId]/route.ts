import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { canManagePeople } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/families/[familyId]">,
) {
  try {
    const { id, familyId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem excluir famílias.");
    }

    const family = await prisma.family.findFirst({
      where: { id: familyId, organizationId: id },
      include: { _count: { select: { persons: true } } },
    });
    if (!family) return jsonError(404, "Família não encontrada.");

    if (family._count.persons > 0) {
      return jsonError(
        400,
        "A família ainda tem pessoas. Exclua as pessoas antes de remover a família.",
      );
    }

    await prisma.family.delete({ where: { id: familyId } });
    return jsonOk({ id: familyId });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
