import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { createPerson } from "@/lib/people";
import { prisma } from "@/lib/prisma";
import { canManagePeople } from "@/lib/roles";
import { personInputSchema } from "@/lib/schemas";
import { getSessionUser } from "@/lib/session";

export async function GET(request: Request, ctx: RouteContext<"/api/organizations/[id]/people">) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const people = await prisma.person.findMany({
      where: { organizationId: id },
      include: {
        familia: { select: { id: true, name: true } },
        spouse: { select: { id: true, nome: true } },
        marriedTo: { select: { id: true, nome: true } },
        member: { select: { id: true, userId: true, role: true } },
      },
      orderBy: [{ familia: { name: "asc" } }, { nome: "asc" }],
    });

    return jsonOk(people);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/organizations/[id]/people">) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem cadastrar pessoas.");
    }

    const body = await request.json().catch(() => null);
    const parsed = personInputSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const result = await createPerson(id, parsed.data);
    if (!result.person) return jsonError(400, result.error ?? "Erro ao salvar.");

    return jsonOk({ person: result.person }, 201);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
