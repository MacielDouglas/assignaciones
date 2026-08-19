import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManagePeople } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";
import { deleteWatchtower } from "@/lib/watchtowers";

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/watchtowers/[watchtowerId]">,
) {
  try {
    const { id, watchtowerId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem excluir Sentinelas.");
    }

    await deleteWatchtower(watchtowerId, id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
