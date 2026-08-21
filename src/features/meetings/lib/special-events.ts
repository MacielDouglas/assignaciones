import {
  addDaysUtc,
  formatDateBR,
  parseIsoDay,
  weekStartUtc,
} from "@/features/meetings/lib/meeting-builder";
import type { SpecialEventKind, WeekDay } from "@/generated/prisma/enums";

/**
 * Camada de domínio dos eventos especiais das reuniões.
 * Toda decisão de renderização parte daqui — a interface não contém IFs
 * por tipo de evento; ela consome o comportamento resolvido no servidor.
 */
export type SpecialEventBehavior = "hideMeetings" | "circuitOverseerVisit";

export const SPECIAL_EVENT_BEHAVIOR: Record<SpecialEventKind, SpecialEventBehavior | null> = {
  MEMORIAL: null,
  SPECIAL_TALK: null,
  CONVENTION: "hideMeetings",
  ASSEMBLY_REPRESENTATIVE: "hideMeetings",
  ASSEMBLY_TRAVELING_OVERSEER: "hideMeetings",
  CIRCUIT_OVERSEER_VISIT: "circuitOverseerVisit",
};

export const SPECIAL_EVENT_TITLES: Record<SpecialEventKind, string> = {
  MEMORIAL: "Comemoração",
  SPECIAL_TALK: "Discurso Especial",
  CONVENTION: "Congresso",
  ASSEMBLY_REPRESENTATIVE: "Assembleia com Representante",
  ASSEMBLY_TRAVELING_OVERSEER: "Assembleia com o Viajante",
  CIRCUIT_OVERSEER_VISIT: "Visita do Superintendente de Circuito",
};

/** Modelo conceitual `meetingSpecialEvent` consumido por páginas e componentes. */
export interface MeetingSpecialEvent {
  id: string;
  kind: SpecialEventKind;
  behavior: SpecialEventBehavior;
  /** Nome oficial do evento (ex.: "Congresso"). */
  title: string;
  theme: string | null;
  location: string | null;
  startDateIso: string;
  endDateIso: string;
  time: string | null;
  /** Nome do superintendente/viajante (visita do circuito). */
  travelerName: string | null;
  serviceTalkTheme: string | null;
  publicTalkTheme: string | null;
  finalTalkTheme: string | null;
}

/** Regras da visita do superintendente (futuro: configurável em Configurações). */
export const CO_VISIT_RULES = {
  /** Dia fixo da reunião de meio de semana durante a visita. */
  midweekDayOverride: "TUESDAY" as WeekDay,
  serviceTalkDuration: 30,
  watchtowerDuration: 30,
  finalTalkDuration: 30,
} as const;

/** O evento cobre a semana exibida? (sobreposição de intervalos) */
export function specialEventCoversWeek(
  event: Pick<MeetingSpecialEvent, "startDateIso" | "endDateIso">,
  weekStartIso: string,
): boolean {
  const weekStart = weekStartUtc(parseIsoDay(weekStartIso));
  const weekEnd = addDaysUtc(weekStart, 6);
  const eventStart = weekStartUtc(parseIsoDay(event.startDateIso));
  const eventEnd = weekStartUtc(parseIsoDay(event.endDateIso));
  return eventStart <= weekEnd && eventEnd >= weekStart;
}

/**
 * Resolve o evento especial da semana. Quando houver mais de um, o
 * comportamento mais restritivo vence (ocultar reuniões > visita).
 */
export function resolveSpecialEventForWeek(
  events: MeetingSpecialEvent[],
  weekStartIso: string,
): MeetingSpecialEvent | null {
  const covering = events.filter((event) => specialEventCoversWeek(event, weekStartIso));
  if (covering.length === 0) return null;
  const priority: Record<SpecialEventBehavior, number> = {
    hideMeetings: 2,
    circuitOverseerVisit: 1,
  };
  return covering.sort((a, b) => priority[b.behavior] - priority[a.behavior])[0];
}

/** Rótulo do período do evento ("DD/MM/AAAA" ou "DD/MM – DD/MM/AAAA"). */
export function specialEventPeriodLabel(
  event: Pick<MeetingSpecialEvent, "startDateIso" | "endDateIso">,
): string {
  const start = formatDateBR(parseIsoDay(event.startDateIso));
  if (!event.endDateIso || event.endDateIso === event.startDateIso) return start;
  return `${start} – ${formatDateBR(parseIsoDay(event.endDateIso))}`;
}

export interface EffectiveScheduleDaysInput {
  midweekDay: WeekDay | null;
  weekendDay: WeekDay | null;
}

/**
 * Dias efetivos das reuniões na semana: durante a visita do superintendente
 * a reunião de meio de semana acontece na terça-feira.
 */
export function effectiveScheduleDays(
  schedule: EffectiveScheduleDaysInput,
  event: MeetingSpecialEvent | null,
): EffectiveScheduleDaysInput {
  if (event?.behavior !== "circuitOverseerVisit") {
    return { midweekDay: schedule.midweekDay, weekendDay: schedule.weekendDay };
  }
  return {
    midweekDay: CO_VISIT_RULES.midweekDayOverride,
    weekendDay: schedule.weekendDay,
  };
}
