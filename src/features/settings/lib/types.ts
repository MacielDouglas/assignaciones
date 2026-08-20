import type { SpecialEventKind, WeekDay } from "@/generated/prisma/enums";

export interface ScheduleData {
  midweekDay: WeekDay | null;
  midweekTime: string | null;
  weekendDay: WeekDay | null;
  weekendTime: string | null;
}

export interface SpecialEventData {
  id: string;
  kind: SpecialEventKind;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
  theme: string | null;
  speaker: string | null;
  traveler: string | null;
  serviceTalk: string | null;
  publicTalk: string | null;
  finalTalk: string | null;
  createdAt: string;
  updatedAt: string;
}

export const EMPTY_SCHEDULE: ScheduleData = {
  midweekDay: null,
  midweekTime: null,
  weekendDay: null,
  weekendTime: null,
};

export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export const WEEKDAY_FULL_LABELS: Record<WeekDay, string> = {
  MONDAY: "segunda-feira",
  TUESDAY: "terça-feira",
  WEDNESDAY: "quarta-feira",
  THURSDAY: "quinta-feira",
  FRIDAY: "sexta-feira",
  SATURDAY: "sábado",
  SUNDAY: "domingo",
};

export const WEEKDAY_ORDER: WeekDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const EVENT_KIND_LABELS: Record<SpecialEventKind, string> = {
  MEMORIAL: "Comemoração",
  SPECIAL_TALK: "Discurso Especial",
  CIRCUIT_OVERSEER_VISIT: "Visita do Superintendente de Circuito",
  CONVENTION: "Congresso",
  ASSEMBLY_TRAVELING_OVERSEER: "Assembleia com o Viajante",
  ASSEMBLY_REPRESENTATIVE: "Assembleia com Representante",
};

export const EVENT_KIND_EMPTY: Record<SpecialEventKind, string> = {
  MEMORIAL: "Nenhuma comemoração configurada.",
  SPECIAL_TALK: "Nenhum discurso especial configurado.",
  CIRCUIT_OVERSEER_VISIT: "Nenhuma visita configurada.",
  CONVENTION: "Nenhum congresso configurado.",
  ASSEMBLY_TRAVELING_OVERSEER: "Nenhuma assembleia configurada.",
  ASSEMBLY_REPRESENTATIVE: "Nenhuma assembleia configurada.",
};

export const EVENT_KIND_ORDER: SpecialEventKind[] = [
  "MEMORIAL",
  "SPECIAL_TALK",
  "CIRCUIT_OVERSEER_VISIT",
  "CONVENTION",
  "ASSEMBLY_TRAVELING_OVERSEER",
  "ASSEMBLY_REPRESENTATIVE",
];

export const LIMITED_PER_YEAR: Record<string, number> = {
  MEMORIAL: 1,
  CONVENTION: 1,
};
