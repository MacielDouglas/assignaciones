import { SpecialEventKind } from "@/generated/prisma/enums";
import { addDaysUtc, formatDay, isoDay, parseIsoDay, weekStartUtc } from "./schedule";
import type {
  GeneralCleaningData,
  ScheduleData,
  SpecialEventData,
  WeeklyCleaningData,
} from "./types";
import { EVENT_KIND_LABELS, WEEKDAY_FULL_LABELS } from "./types";

export interface CleaningContext {
  schedule: ScheduleData;
  events: SpecialEventData[];
  weekly: WeeklyCleaningData;
  general: GeneralCleaningData[];
  today: Date;
}

export type CleaningReason = "MIDWEEK" | "WEEKEND" | "BOTH" | "MEMORIAL" | "SPECIAL_TALK";

const BLOCKING_KINDS: SpecialEventKind[] = [
  SpecialEventKind.CONVENTION,
  SpecialEventKind.ASSEMBLY_TRAVELING_OVERSEER,
  SpecialEventKind.ASSEMBLY_REPRESENTATIVE,
];

export interface WeekCleaning {
  weekStart: string;
  reason: CleaningReason | null;
  reasonLabel: string | null;
  afterMeeting: boolean;
  weekly: boolean;
  weeklyCancelled: boolean;
  general: GeneralCleaningData | null;
  blockedBy: string | null;
}

function eventInWeek(event: SpecialEventData, weekStart: string): boolean {
  const start = weekStartUtc(parseIsoDay(event.date));
  const end = event.endDate ? parseIsoDay(event.endDate) : parseIsoDay(event.date);
  const weekEnd = addDaysUtc(parseIsoDay(weekStart), 6);
  return start <= weekEnd && end >= parseIsoDay(weekStart);
}

const REASON_LABELS: Record<CleaningReason, string> = {
  MIDWEEK: "reunião de meio de semana",
  WEEKEND: "reunião de fim de semana",
  BOTH: "reuniões da semana",
  MEMORIAL: "comemoração",
  SPECIAL_TALK: "discurso especial",
};

export function cleaningForWeek(weekStart: Date, ctx: CleaningContext): WeekCleaning {
  const weekKey = isoDay(weekStart);
  const inWeek = ctx.events.filter((event) => eventInWeek(event, weekKey));
  const blocker = inWeek.find((event) => BLOCKING_KINDS.includes(event.kind)) ?? null;

  let reason: CleaningReason | null = null;
  let afterMeeting = false;
  if (blocker) {
    afterMeeting = false;
  } else if (inWeek.some((event) => event.kind === SpecialEventKind.MEMORIAL)) {
    reason = "MEMORIAL";
    afterMeeting = true;
  } else if (inWeek.some((event) => event.kind === SpecialEventKind.SPECIAL_TALK)) {
    reason = "SPECIAL_TALK";
    afterMeeting = true;
  } else if (ctx.schedule.midweekDay !== null || ctx.schedule.weekendDay !== null) {
    reason =
      ctx.schedule.midweekDay !== null && ctx.schedule.weekendDay !== null
        ? "BOTH"
        : ctx.schedule.midweekDay !== null
          ? "MIDWEEK"
          : "WEEKEND";
    afterMeeting = true;
  }

  const general =
    ctx.general.find(
      (cleaning) => weekStartUtc(parseIsoDay(cleaning.date)).getTime() === weekStart.getTime(),
    ) ?? null;
  const weekly = ctx.weekly.enabled;
  const weeklyCancelled = weekly && general !== null;

  return {
    weekStart: weekKey,
    reason,
    reasonLabel: reason ? REASON_LABELS[reason] : null,
    afterMeeting,
    weekly,
    weeklyCancelled,
    general,
    blockedBy: blocker ? EVENT_KIND_LABELS[blocker.kind].toLowerCase() : null,
  };
}

export interface CleaningConflict {
  id: string;
  message: string;
  level: "error" | "warning";
}

export function findCleaningConflicts(ctx: CleaningContext): CleaningConflict[] {
  const conflicts: CleaningConflict[] = [];
  if (!ctx.weekly.enabled) return conflicts;

  const currentWeek = weekStartUtc(ctx.today).getTime();
  for (const cleaning of ctx.general) {
    const week = weekStartUtc(parseIsoDay(cleaning.date));
    if (week.getTime() < currentWeek) continue;
    const weekLabel = formatDay(week);
    const dateLabel = formatDay(parseIsoDay(cleaning.date));
    const dayLabel = WEEKDAY_FULL_LABELS[ctx.weekly.day ?? "MONDAY"];
    conflicts.push({
      id: cleaning.id,
      message: `Limpeza Geral em ${dateLabel} na semana de ${weekLabel}: a Limpeza Semanal (${dayLabel}) será cancelada nessa semana.`,
      level: "warning",
    });
    conflicts.push({
      id: "weekly",
      message: `Conflita com a Limpeza Geral em ${dateLabel} na semana de ${weekLabel}.`,
      level: "warning",
    });
  }
  return conflicts;
}

export function cleaningPreview(ctx: CleaningContext, weeks = 8): WeekCleaning[] {
  const start = weekStartUtc(ctx.today);
  return Array.from({ length: weeks }, (_, index) =>
    cleaningForWeek(addDaysUtc(start, index * 7), ctx),
  );
}
