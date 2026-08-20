import { getWeeklyCleaning, saveWeeklyCleaning } from "@/features/settings/lib/cleaning-data";
import { cleaningWeeklySchema } from "@/features/settings/schemas";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManageSettings } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/settings/cleaning/weekly">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const weekly = await getWeeklyCleaning(id);
    return jsonOk(weekly);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/settings/cleaning/weekly">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManageSettings(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem configurar a Limpeza Semanal.");
    }

    const body = await request.json().catch(() => null);
    const parsed = cleaningWeeklySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const weekly = await saveWeeklyCleaning(id, parsed.data);
    return jsonOk(weekly);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
