import { listEvents, upsertEvent } from "@/features/settings/lib/events";
import { specialEventInputSchema } from "@/features/settings/schemas";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManageSettings } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/settings/events">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const events = await listEvents(id);
    return jsonOk(events);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/settings/events">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManageSettings(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem cadastrar eventos.");
    }

    const body = await request.json().catch(() => null);
    const parsed = specialEventInputSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const result = await upsertEvent(id, parsed.data);
    if (!result.event) return jsonError(400, result.error ?? "Erro ao salvar.");

    return jsonOk({ event: result.event }, 201);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
