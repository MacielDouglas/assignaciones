import { MeetingType } from "@/generated/prisma/enums";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { listMeetings, upsertMeeting } from "@/lib/meetings";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManagePeople } from "@/lib/roles";
import { meetingSaveSchema } from "@/lib/schemas";
import { getSessionUser } from "@/lib/session";

export async function GET(request: Request, ctx: RouteContext<"/api/organizations/[id]/meetings">) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const url = new URL(request.url);
    const meetingTypeParam = url.searchParams.get("meetingType");
    const meetingType: MeetingType =
      meetingTypeParam === "WEEKEND" ? MeetingType.WEEKEND : MeetingType.MIDWEEK;

    const meetings = await listMeetings(id, meetingType);
    return jsonOk(meetings);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/meetings">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManagePeople(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem salvar apostilas.");
    }

    const body = await request.json().catch(() => null);
    const parsed = meetingSaveSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const meeting = await upsertMeeting(id, parsed.data);
    return jsonOk({ meeting }, 201);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
