import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManagePeople } from "@/lib/roles";
import { talksSaveSchema } from "@/lib/schemas";
import { getSessionUser } from "@/lib/session";
import { listTalks, replaceTalks } from "@/lib/talks";

export async function GET(request: Request, ctx: RouteContext<"/api/organizations/[id]/talks">) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const talks = await listTalks(id);
    return jsonOk({ talks });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/organizations/[id]/talks">) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem salvar os discursos.");
    }

    const body = await request.json().catch(() => null);
    const parsed = talksSaveSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    await replaceTalks(id, parsed.data.items);
    const talks = await listTalks(id);
    return jsonOk({ talks }, 201);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
