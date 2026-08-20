import { deleteEvent, upsertEvent } from "@/features/settings/lib/events";
import { specialEventInputSchema } from "@/features/settings/schemas";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManageSettings } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/settings/events/[eventId]">,
) {
  try {
    const { id, eventId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManageSettings(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem editar eventos.");
    }

    const body = await request.json().catch(() => null);
    const parsed = specialEventInputSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const result = await upsertEvent(id, parsed.data, eventId);
    if (!result.event) return jsonError(400, result.error ?? "Erro ao salvar.");

    return jsonOk({ event: result.event });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/settings/events/[eventId]">,
) {
  try {
    const { id, eventId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManageSettings(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem excluir eventos.");
    }

    const result = await deleteEvent(eventId, id);
    if (!result.deleted) return jsonError(400, result.error ?? "Erro ao excluir.");

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
