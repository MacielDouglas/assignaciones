import type { WorkbookContent, WorkbookWeek } from "@/features/meetings/lib/jwpub";
import { findWorkbookWeek } from "@/features/meetings/lib/meeting-builder";
import { mergePartOverride } from "@/features/meetings/lib/part-overrides";
import {
  listScheduledMeetings,
  saveScheduledMeeting,
} from "@/features/meetings/lib/scheduled-meetings";
import { workbookIssueKey } from "@/features/meetings/lib/workbook-meta";
import { programPartSchema } from "@/features/meetings/schemas";
import type { Prisma } from "@/generated/prisma/client";
import type { MeetingType } from "@/generated/prisma/enums";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { canManagePeople } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/meetings/program-part">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem editar a programação.");
    }

    const body = await request.json().catch(() => null);
    const parsed = programPartSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }
    const { weekStart, meetingType, partId, overrides, slots } = parsed.data;

    // Localiza a apostila + semana que cobre a data informada.
    const rows = await prisma.meetingWorkbook.findMany({
      where: { organizationId: id },
      orderBy: { updatedAt: "desc" },
    });
    const sorted = [...rows].sort(
      (a, b) => workbookIssueKey(b.symbol) - workbookIssueKey(a.symbol),
    );
    const match = sorted
      .map((row) => ({
        row,
        week: findWorkbookWeek(row.content as unknown as WorkbookContent, row.symbol, weekStart),
      }))
      .find(
        (
          entry,
        ): entry is {
          row: (typeof sorted)[number];
          week: WorkbookWeek;
        } => entry.week !== null,
      );

    if (!match) {
      return jsonError(404, "Nenhuma apostila importada cobre essa semana.");
    }

    // Persiste o override no JSON da apostila (chave semana::parte).
    if (Object.keys(overrides).length > 0) {
      const content = structuredClone(match.row.content) as unknown as WorkbookContent;
      mergePartOverride(content, match.week.week, partId, overrides);
      await prisma.meetingWorkbook.update({
        where: { id: match.row.id },
        data: { content: content as unknown as Prisma.InputJsonValue },
      });
    }

    // Mescla as designações da parte na programação salva da semana.
    if (slots.length > 0) {
      const savedMeetings = await listScheduledMeetings(id);
      const existing = savedMeetings.find(
        (meeting) => meeting.weekStart === weekStart && meeting.meetingType === meetingType,
      );
      const assignmentsMap = new Map(
        existing?.assignments.map((assignment) => [
          assignment.partId,
          { label: assignment.label, personId: assignment.personId },
        ]),
      );
      for (const slot of slots) {
        const current = assignmentsMap.get(slot.slotId);
        if (slot.personId) {
          assignmentsMap.set(slot.slotId, {
            label: current?.label ?? slot.label,
            personId: slot.personId,
          });
        } else {
          assignmentsMap.delete(slot.slotId);
        }
      }
      await saveScheduledMeeting(id, {
        weekStart,
        meetingType: meetingType as MeetingType,
        middleSong: existing?.middleSong ?? null,
        openingSong: existing?.openingSong ?? null,
        closingSong: existing?.closingSong ?? null,
        talkNumber: existing?.talkNumber ?? null,
        articleId: existing?.articleId ?? null,
        assignments: [...assignmentsMap].map(([slotId, value]) => ({
          partId: slotId,
          label: value.label,
          personId: value.personId,
        })),
      });
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(400, getErrorMessage(error));
  }
}
