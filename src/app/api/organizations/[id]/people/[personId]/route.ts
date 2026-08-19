import { deletePerson, updatePerson } from "@/features/people/lib/people";
import { personUpdateSchema } from "@/features/people/schemas";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManagePeople } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/people/[personId]">,
) {
  try {
    const { id, personId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem editar pessoas.");
    }

    const body = await request.json().catch(() => null);
    const parsed = personUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const result = await updatePerson(personId, id, parsed.data);
    if (!result.person) return jsonError(400, result.error ?? "Erro ao salvar.");

    return jsonOk({ person: result.person });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/people/[personId]">,
) {
  try {
    const { id, personId } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem excluir pessoas.");
    }

    const result = await deletePerson(personId, id);
    if (!result.deleted) return jsonError(400, result.error ?? "Erro ao excluir.");

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
