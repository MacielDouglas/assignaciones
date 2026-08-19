import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManagePeople } from "@/lib/roles";
import { watchtowerSaveSchema } from "@/lib/schemas";
import { getSessionUser } from "@/lib/session";
import { listWatchtowers, pruneWatchtowers, upsertWatchtower } from "@/lib/watchtowers";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/watchtowers">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const watchtowers = await listWatchtowers(id);
    return jsonOk(watchtowers);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/watchtowers">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem salvar Sentinelas.");
    }

    const body = await request.json().catch(() => null);
    const parsed = watchtowerSaveSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const watchtower = await upsertWatchtower(id, parsed.data);
    await pruneWatchtowers(id);
    return jsonOk({ watchtower }, 201);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
