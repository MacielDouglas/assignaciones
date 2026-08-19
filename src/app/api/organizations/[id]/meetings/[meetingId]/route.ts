import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { deleteMeeting, updateMeeting } from "@/lib/meetings";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManagePeople } from "@/lib/roles";
import { meetingUpdateSchema } from "@/lib/schemas";
import { getSessionUser } from "@/lib/session";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/meetings/[meetingId]">,
) {
  try {
    const { id, meetingId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem editar apostilas.");
    }

    const body = await request.json().catch(() => null);
    const parsed = meetingUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const meeting = await updateMeeting(meetingId, id, parsed.data);
    if (!meeting) return jsonError(404, "Apostila não encontrada.");

    return jsonOk({ meeting });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/meetings/[meetingId]">,
) {
  try {
    const { id, meetingId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem excluir apostilas.");
    }

    const result = await deleteMeeting(meetingId, id);
    if (result.count === 0) return jsonError(404, "Apostila não encontrada.");

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
