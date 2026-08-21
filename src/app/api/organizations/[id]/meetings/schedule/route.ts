import type { NextRequest } from "next/server";
import { validateScheduledAssignments } from "@/features/meetings/lib/schedule-validation";
import {
  deleteScheduledWeek,
  listScheduledMeetings,
  saveScheduledMeeting,
} from "@/features/meetings/lib/scheduled-meetings";
import { scheduledMeetingSchema } from "@/features/meetings/schemas";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/organizations";
import { canManageSettings } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/meetings/schedule">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership) return jsonError(403, "Você não pertence a esta organização.");

    const meetings = await listScheduledMeetings(id);
    return jsonOk(meetings);
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/organizations/[id]/meetings/schedule">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManageSettings(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem programar as reuniões.");
    }

    const body = await request.json().catch(() => null);
    const parsed = scheduledMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    // Regras de designação aplicadas exclusivamente no backend.
    const { errors, warnings } = await validateScheduledAssignments(id, parsed.data);
    if (errors.length > 0) {
      return jsonError(422, errors[0].message, { issues: [...errors, ...warnings] });
    }

    const meeting = await saveScheduledMeeting(id, parsed.data);
    return jsonOk({ ...meeting, warnings });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/organizations/[id]/meetings/schedule">,
) {
  try {
    const { id } = await ctx.params;
    const user = await getSessionUser(request);
    if (!user) return jsonError(401, "Não autenticado.");

    const membership = await requireOrganizationAccess(id, user.id, user.isSubUser);
    if (!membership || !canManageSettings(membership.role)) {
      return jsonError(403, "Apenas owners e admins podem excluir programações.");
    }

    const weekStart = request.nextUrl.searchParams.get("weekStart");
    if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      return jsonError(400, "Semana inválida.");
    }

    await deleteScheduledWeek(id, weekStart);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(500, getErrorMessage(error));
  }
}
