import {
  addDaysUtc,
  formatDateBR,
  isoDay,
  parseIsoDay,
  weekStartUtc,
} from "@/features/meetings/lib/meeting-builder";
import {
  effectiveScheduleDays,
  type MeetingSpecialEvent,
} from "@/features/meetings/lib/special-events";
import { findSpecialEventForWeek } from "@/features/meetings/lib/special-events-service";
import type { WeekDay } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const WEEKDAY_ORDER: WeekDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const WEEKDAY_SHORT_LABELS: Record<WeekDay, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export interface UserAssignmentSummary {
  /** Rótulo da parte/designação. */
  label: string;
  meetingType: "MIDWEEK" | "WEEKEND";
  /** Data efetiva da reunião (considera mudança de dia na visita). */
  dateLabel: string;
  weekdayLabel: string;
  timeLabel: string;
  /** Nomes dos ajudantes da mesma parte (quando existirem). */
  helpers: string[];
}

function basePartId(slotId: string): string {
  return slotId.replace(/-(student|helper|slot|speaker|director|reader|prayer)$/i, "");
}

function isHelperSlot(partId: string): boolean {
  return /-helper$/i.test(partId);
}

interface MeetingRow {
  weekStart: Date;
  meetingType: "MIDWEEK" | "WEEKEND";
  assignments: {
    partId: string;
    label: string;
    personId: string;
    person: { nome: string };
  }[];
}

function summarizeMeeting(
  meeting: MeetingRow,
  personId: string,
  days: { midweekDay: WeekDay | null; weekendDay: WeekDay | null },
  times: { midweekTime: string; weekendTime: string },
): UserAssignmentSummary[] {
  const isMidweek = meeting.meetingType === "MIDWEEK";
  const day = isMidweek ? days.midweekDay : days.weekendDay;
  const time = isMidweek ? times.midweekTime : times.weekendTime;
  const weekStart = parseIsoDay(isoDay(meeting.weekStart));
  const dayIndex = day ? WEEKDAY_ORDER.indexOf(day) : 0;
  const meetingDate = addDaysUtc(weekStart, dayIndex);

  return meeting.assignments
    .filter((assignment) => assignment.personId === personId && !isHelperSlot(assignment.partId))
    .map((assignment) => {
      const base = basePartId(assignment.partId);
      const helpers = meeting.assignments
        .filter(
          (candidate) =>
            candidate.partId.startsWith(`${base}-`) &&
            isHelperSlot(candidate.partId) &&
            candidate.personId !== personId,
        )
        .map((candidate) => candidate.person.nome);
      return {
        label: assignment.label,
        meetingType: meeting.meetingType,
        dateLabel: formatDateBR(meetingDate),
        weekdayLabel: day ? WEEKDAY_SHORT_LABELS[day] : "",
        timeLabel: time,
        helpers,
      };
    });
}

/**
 * Designações do publicador vinculado ao usuário nas semanas atual e
 * seguinte, em consultas otimizadas (duas reuniões por consulta única,
 * com co-designações incluídas para resolver ajudantes).
 */
export async function getUserWeekAssignments(
  organizationId: string,
  personId: string,
): Promise<{ current: UserAssignmentSummary[]; next: UserAssignmentSummary[] }> {
  const now = new Date();
  const thisWeek = weekStartUtc(now);
  const nextWeek = addDaysUtc(thisWeek, 7);

  const [meetings, scheduleRow, currentEvent, nextEvent] = await Promise.all([
    prisma.scheduledMeeting.findMany({
      where: { organizationId, weekStart: { gte: thisWeek, lt: addDaysUtc(nextWeek, 7) } },
      select: {
        weekStart: true,
        meetingType: true,
        assignments: {
          select: { partId: true, label: true, personId: true, person: { select: { nome: true } } },
        },
      },
    }),
    prisma.meetingSchedule.findUnique({ where: { organizationId } }),
    findSpecialEventForWeek(organizationId, isoDay(thisWeek)),
    findSpecialEventForWeek(organizationId, isoDay(nextWeek)),
  ]);

  const times = {
    midweekTime: scheduleRow?.midweekTime ?? "19:30",
    weekendTime: scheduleRow?.weekendTime ?? "09:30",
  };

  function collect(weekStart: Date, event: MeetingSpecialEvent | null): UserAssignmentSummary[] {
    const days = effectiveScheduleDays(
      {
        midweekDay: scheduleRow?.midweekDay ?? null,
        weekendDay: scheduleRow?.weekendDay ?? null,
      },
      event,
    );
    return meetings
      .filter((meeting) => meeting.weekStart.getTime() === weekStart.getTime())
      .flatMap((meeting) => summarizeMeeting(meeting, personId, days, times))
      .sort((a, b) => (a.dateLabel < b.dateLabel ? -1 : a.dateLabel > b.dateLabel ? 1 : 0));
  }

  return {
    current: collect(thisWeek, currentEvent),
    next: collect(nextWeek, nextEvent),
  };
}
