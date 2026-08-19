import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { parseWorkbook } from "@/lib/jwpub";
import { requireOrganizationAccess } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { canManagePeople } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/meetings/import">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem importar apostilas.");
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) return jsonError(400, "Envie o arquivo .jwpub.");

    const file = formData.get("file");
    if (!(file instanceof File)) return jsonError(400, "Envie o arquivo .jwpub.");

    if (!file.name.toLowerCase().endsWith(".jwpub")) {
      return jsonError(400, "O arquivo deve ter a extensão .jwpub.");
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const workbook = parseWorkbook(buffer);

    const meetingType = workbook.symbol.startsWith("w") ? "WEEKEND" : "MIDWEEK";

    const existing = await prisma.meetingWorkbook.findFirst({
      where: { organizationId: id, symbol: workbook.symbol },
      select: { id: true, name: true, updatedAt: true },
    });

    return jsonOk({ workbook, meetingType, exists: existing !== null, existing });
  } catch (error) {
    return jsonError(400, getErrorMessage(error));
  }
}
