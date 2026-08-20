import type { WeekDay } from "@/generated/prisma/enums";
import { SpecialEventKind } from "@/generated/prisma/enums";
import type { ScheduleData, SpecialEventData } from "./types";
import { EMPTY_SCHEDULE, EVENT_KIND_LABELS, WEEKDAY_FULL_LABELS, WEEKDAY_ORDER } from "./types";

export function parseIsoDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function yearOfUtc(date: Date): number {
  return date.getUTCFullYear();
}

export function dayOfWeek(date: Date): WeekDay {
  return WEEKDAY_ORDER[(date.getUTCDay() + 6) % 7];
}

export function weekStartUtc(date: Date): Date {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return addDaysUtc(monday, -((monday.getUTCDay() + 6) % 7));
}

export function formatDay(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

export interface MeetingEffect {
  kind: "normal" | "tuesday" | "cancelled" | "specialTalk" | "shortened";
  detail: string;
}

export interface EventImpact {
  weekStarts: Date[];
  midweek: MeetingEffect;
  weekend: MeetingEffect;
}

export interface EventConflict {
  eventId: string;
  message: string;
  level: "error" | "warning";
}

export function eventWeeks(event: SpecialEventData): Date[] {
  const start = weekStartUtc(parseIsoDay(event.date));
  const end = event.endDate ? parseIsoDay(event.endDate) : parseIsoDay(event.date);
  const weeks: Date[] = [];
  let current = start;
  while (current <= end) {
    weeks.push(current);
    current = addDaysUtc(current, 7);
  }
  return weeks;
}

function isWeekday(date: Date): boolean {
  return dayOfWeek(date) !== "SATURDAY" && dayOfWeek(date) !== "SUNDAY";
}

function weekdayLabel(day: WeekDay | null): string {
  return day ? ` (${WEEKDAY_FULL_LABELS[day]})` : "";
}

function meetingOn(day: WeekDay | null, meeting: string): string {
  return day ? `${meeting} de ${WEEKDAY_FULL_LABELS[day]}` : meeting;
}

export function eventImpact(event: SpecialEventData, schedule: ScheduleData): EventImpact {
  const date = parseIsoDay(event.date);
  switch (event.kind) {
    case SpecialEventKind.MEMORIAL: {
      if (isWeekday(date)) {
        return {
          weekStarts: eventWeeks(event),
          midweek: {
            kind: "cancelled",
            detail: `${meetingOn(schedule.midweekDay, "A comemoração substitui a reunião de meio de semana")} dessa semana.`,
          },
          weekend: { kind: "normal", detail: "" },
        };
      }
      return {
        weekStarts: eventWeeks(event),
        midweek: { kind: "normal", detail: "" },
        weekend: {
          kind: "cancelled",
          detail: `${meetingOn(schedule.weekendDay, "A comemoração substitui a reunião de fim de semana")} dessa semana.`,
        },
      };
    }
    case SpecialEventKind.SPECIAL_TALK:
      return {
        weekStarts: eventWeeks(event),
        midweek: { kind: "normal", detail: "" },
        weekend: {
          kind: "specialTalk",
          detail: "Substitui o discurso da reunião de fim de semana, no horário configurado.",
        },
      };
    case SpecialEventKind.CIRCUIT_OVERSEER_VISIT:
      return {
        weekStarts: eventWeeks(event),
        midweek: {
          kind: "tuesday",
          detail:
            "A reunião de meio de semana passa para terça-feira, no mesmo horário. O estudo bíblico dá lugar a um discurso de serviço.",
        },
        weekend: {
          kind: "shortened",
          detail:
            "O estudo de A Sentinela passa de 60 para 30 minutos e, depois, há o discurso final.",
        },
      };
    case SpecialEventKind.CONVENTION:
    case SpecialEventKind.ASSEMBLY_TRAVELING_OVERSEER:
    case SpecialEventKind.ASSEMBLY_REPRESENTATIVE:
      return {
        weekStarts: eventWeeks(event),
        midweek: {
          kind: "cancelled",
          detail: `Não há reunião de meio de semana${weekdayLabel(schedule.midweekDay)} nessa semana.`,
        },
        weekend: {
          kind: "cancelled",
          detail: `Não há reunião de fim de semana${weekdayLabel(schedule.weekendDay)} nessa semana.`,
        },
      };
  }
}

function effectsClash(a: MeetingEffect, b: MeetingEffect): boolean {
  const aActive = a.kind !== "normal";
  const bActive = b.kind !== "normal";
  if (!aActive && !bActive) return false;
  if (aActive && bActive) {
    if (a.kind === "cancelled" && b.kind === "cancelled") return false;
    return true;
  }
  return false;
}

export function findConflicts(events: SpecialEventData[]): EventConflict[] {
  const conflicts: EventConflict[] = [];

  const limited = new Map<SpecialEventKind, Map<number, SpecialEventData[]>>();
  for (const event of events) {
    if (event.kind === SpecialEventKind.MEMORIAL || event.kind === SpecialEventKind.CONVENTION) {
      const year = yearOfUtc(parseIsoDay(event.date));
      const byYear = limited.get(event.kind) ?? new Map<number, SpecialEventData[]>();
      const list = byYear.get(year) ?? [];
      list.push(event);
      byYear.set(year, list);
      limited.set(event.kind, byYear);
    }
  }
  for (const [kind, byYear] of limited) {
    for (const [year, list] of byYear) {
      for (const extra of list.slice(1)) {
        const label = EVENT_KIND_LABELS[kind].toLowerCase();
        conflicts.push({
          eventId: extra.id,
          message: `Já existe ${kind === SpecialEventKind.MEMORIAL ? "uma" : "um"} ${label} no ano de ${year}.`,
          level: "error",
        });
      }
    }
  }

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      const weeksA = eventWeeks(a);
      const weeksB = eventWeeks(b);
      const shared = weeksA.filter((week) =>
        weeksB.some((other) => other.getTime() === week.getTime()),
      );
      if (shared.length === 0) continue;

      const impactA = eventImpact(a, EMPTY_SCHEDULE);
      const impactB = eventImpact(b, EMPTY_SCHEDULE);
      const midweekClash = effectsClash(impactA.midweek, impactB.midweek);
      const weekendClash = effectsClash(impactA.weekend, impactB.weekend);
      if (!midweekClash && !weekendClash) continue;

      const label = EVENT_KIND_LABELS[b.kind].toLowerCase();
      const weekLabel = formatDay(shared[0]);
      const message = `Conflita com ${label} na semana de ${weekLabel}.`;
      conflicts.push({ eventId: a.id, message, level: "warning" });
      conflicts.push({
        eventId: b.id,
        message: `Conflita com ${EVENT_KIND_LABELS[a.kind].toLowerCase()} na semana de ${weekLabel}.`,
        level: "warning",
      });
    }
  }

  return conflicts;
}
