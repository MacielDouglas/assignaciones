import { getSchedule, saveSchedule } from "@/features/settings/lib/events";
import { meetingScheduleSchema } from "@/features/settings/schemas";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManageSettings } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/settings/schedule">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const schedule = await getSchedule(id);
    return jsonOk(schedule);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/settings/schedule">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManageSettings(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem configurar as reuniões.");
    }

    const body = await request.json().catch(() => null);
    const parsed = meetingScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const schedule = await saveSchedule(id, parsed.data);
    return jsonOk(schedule);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
