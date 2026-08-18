import { z } from "zod";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { canManagePeople } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

const createFamilySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da família.").max(60, "Nome muito longo."),
});

export async function GET(request: Request, ctx: RouteContext<"/api/organizations/[id]/families">) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const families = await prisma.family.findMany({
      where: { organizationId: id },
      include: {
        _count: { select: { persons: true } },
      },
      orderBy: { name: "asc" },
    });

    return jsonOk(families);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/families">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem criar famílias.");
    }

    const body = await request.json().catch(() => null);
    const parsed = createFamilySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const existing = await prisma.family.findFirst({
      where: { organizationId: id, name: parsed.data.name },
    });
    if (existing) return jsonError(400, "Já existe uma família com esse nome.");

    const family = await prisma.family.create({
      data: { name: parsed.data.name, organizationId: id },
    });

    return jsonOk({ id: family.id, name: family.name }, 201);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
