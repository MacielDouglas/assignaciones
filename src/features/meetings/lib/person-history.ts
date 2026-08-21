import { formatDateBR, isoDay } from "@/features/meetings/lib/meeting-builder";
import type { MeetingType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export interface PersonAssignmentEntry {
  /** Semana ISO da reunião. */
  weekStart: string;
  meetingType: MeetingType;
  /** Rótulo da parte/designação. */
  label: string;
  /** Data formatada (dd/MM/aaaa) calculada no servidor. */
  dateLabel: string;
}

const HISTORY_LIMIT_ROWS = 2000;
/** Máximo de entradas exibidas por pessoa. */
export const PERSON_HISTORY_LIMIT = 10;

/**
 * Histórico de designações por pessoa (semanas já iniciadas ou passadas),
 * ordenado da mais recente para a mais antiga.
 */
export async function getPeopleAssignmentHistory(
  organizationId: string,
): Promise<Map<string, PersonAssignmentEntry[]>> {
  const nowIso = isoDay(new Date());
  const rows = await prisma.scheduledAssignment.findMany({
    where: {
      scheduledMeeting: { organizationId, weekStart: { lte: new Date(`${nowIso}T00:00:00Z`) } },
    },
    select: {
      personId: true,
      label: true,
      scheduledMeeting: {
        select: { weekStart: true, meetingType: true },
      },
    },
    orderBy: { scheduledMeeting: { weekStart: "desc" } },
    take: HISTORY_LIMIT_ROWS,
  });

  const grouped = new Map<string, PersonAssignmentEntry[]>();
  for (const row of rows) {
    const list = grouped.get(row.personId) ?? [];
    if (list.length >= PERSON_HISTORY_LIMIT) continue;
    list.push({
      weekStart: isoDay(row.scheduledMeeting.weekStart),
      meetingType: row.scheduledMeeting.meetingType,
      label: row.label,
      dateLabel: formatDateBR(row.scheduledMeeting.weekStart),
    });
    grouped.set(row.personId, list);
  }
  return grouped;
}

export async function getPersonAssignmentHistory(
  organizationId: string,
  personId: string,
): Promise<PersonAssignmentEntry[]> {
  const all = await getPeopleAssignmentHistory(organizationId);
  return all.get(personId) ?? [];
}
