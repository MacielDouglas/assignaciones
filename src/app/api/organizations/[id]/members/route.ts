import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(request: Request, ctx: RouteContext<"/api/organizations/[id]/members">) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        person: { select: { id: true, nome: true, sexo: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return jsonOk(members);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
