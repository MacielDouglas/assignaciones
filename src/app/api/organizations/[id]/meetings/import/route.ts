import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { parsePublication } from "@/lib/jwpub";
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
      return jsonError(403, "Apenas owners e admins podem importar arquivos.");
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) return jsonError(400, "Envie o arquivo .jwpub.");

    const file = formData.get("file");
    if (!(file instanceof File)) return jsonError(400, "Envie o arquivo .jwpub.");

    if (!file.name.toLowerCase().endsWith(".jwpub")) {
      return jsonError(400, "O arquivo deve ter a extensão .jwpub.");
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const parsed = parsePublication(buffer);

    if (parsed.kind === "watchtower") {
      const existing = await prisma.watchtower.findFirst({
        where: { organizationId: id, symbol: parsed.symbol },
        select: { id: true, name: true, updatedAt: true },
      });
      return jsonOk({
        kind: "watchtower",
        watchtower: {
          symbol: parsed.symbol,
          name: parsed.name,
          languageCode: parsed.languageCode,
          fileName: parsed.fileName,
          articles: parsed.articles,
        },
        exists: existing !== null,
        existing,
      });
    }

    const meetingType = parsed.symbol.startsWith("mwb") ? "MIDWEEK" : "WEEKEND";
    const existing = await prisma.meetingWorkbook.findFirst({
      where: { organizationId: id, symbol: parsed.symbol },
      select: { id: true, name: true, updatedAt: true },
    });
    return jsonOk({
      kind: "workbook",
      meetingType,
      workbook: {
        symbol: parsed.symbol,
        name: parsed.name,
        shortTitle: parsed.shortTitle,
        displayTitle: parsed.displayTitle,
        referenceTitle: parsed.referenceTitle,
        languageCode: parsed.languageCode,
        coverImageUrl: null,
        content: parsed.content,
      },
      exists: existing !== null,
      existing,
    });
  } catch (error) {
    return jsonError(400, getErrorMessage(error));
  }
}
