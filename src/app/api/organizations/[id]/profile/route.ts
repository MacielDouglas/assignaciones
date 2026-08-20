import { z } from "zod";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const profileNameSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(120, "Nome muito longo."),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/profile">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership?.personId) {
      return jsonError(403, "Nenhuma pessoa vinculada ao seu usuário.");
    }

    const body = await request.json().catch(() => null);
    const parsed = profileNameSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const person = await prisma.person.update({
      where: { id: membership.personId },
      data: { nome: parsed.data.nome },
      select: { id: true, nome: true },
    });

    return jsonOk({ person });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
