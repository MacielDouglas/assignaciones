import { deleteWeeklySector, upsertWeeklySector } from "@/features/settings/lib/cleaning-data";
import { cleaningListSectorSchema } from "@/features/settings/schemas";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManageSettings } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/settings/cleaning/weekly-sectors/[sectorId]">,
) {
  try {
    const { id, sectorId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManageSettings(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem editar setores de limpeza.");
    }

    const body = await request.json().catch(() => null);
    const parsed = cleaningListSectorSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const result = await upsertWeeklySector(id, parsed.data, sectorId);
    if (!result.sector) return jsonError(400, result.error ?? "Erro ao salvar.");

    return jsonOk({ sector: result.sector });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/settings/cleaning/weekly-sectors/[sectorId]">,
) {
  try {
    const { id, sectorId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManageSettings(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem excluir setores de limpeza.");
    }

    const result = await deleteWeeklySector(sectorId, id);
    if (!result.deleted) return jsonError(400, result.error ?? "Erro ao excluir.");

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
