import type { SpecialEvent as SpecialEventRow } from "@/generated/prisma/client";
import { SpecialEventKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { SpecialEventInput } from "../schemas";
import { isoDay, parseIsoDay, yearOfUtc } from "./schedule";
import type { ScheduleData, SpecialEventData } from "./types";
import { EMPTY_SCHEDULE, EVENT_KIND_LABELS } from "./types";

export async function getSchedule(organizationId: string): Promise<ScheduleData> {
  const row = await prisma.meetingSchedule.findUnique({
    where: { organizationId },
  });
  if (!row) return EMPTY_SCHEDULE;
  return {
    midweekDay: row.midweekDay,
    midweekTime: row.midweekTime,
    weekendDay: row.weekendDay,
    weekendTime: row.weekendTime,
  };
}

export async function saveSchedule(
  organizationId: string,
  data: ScheduleData,
): Promise<ScheduleData> {
  await prisma.meetingSchedule.upsert({
    where: { organizationId },
    update: data,
    create: { organizationId, ...data },
  });
  return data;
}

function toEventData(row: SpecialEventRow): SpecialEventData {
  return {
    id: row.id,
    kind: row.kind,
    date: isoDay(row.date),
    endDate: row.endDate ? isoDay(row.endDate) : null,
    time: row.time,
    location: row.location,
    theme: row.theme,
    speaker: row.speaker,
    traveler: row.traveler,
    serviceTalk: row.serviceTalk,
    publicTalk: row.publicTalk,
    finalTalk: row.finalTalk,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listEvents(organizationId: string): Promise<SpecialEventData[]> {
  const rows = await prisma.specialEvent.findMany({
    where: { organizationId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toEventData);
}

const LIMIT_PER_YEAR: Partial<Record<SpecialEventKind, number>> = {
  [SpecialEventKind.MEMORIAL]: 1,
  [SpecialEventKind.CONVENTION]: 1,
};

function limitMessage(kind: SpecialEventKind, year: number): string {
  const label = EVENT_KIND_LABELS[kind].toLowerCase();
  const article = kind === SpecialEventKind.MEMORIAL ? "uma" : "um";
  return `Já existe ${article} ${label} no ano de ${year}.`;
}

interface NormalizedEvent {
  date: Date;
  endDate: Date | null;
  time: string | null;
  location: string | null;
  theme: string | null;
  speaker: string | null;
  traveler: string | null;
  serviceTalk: string | null;
  publicTalk: string | null;
  finalTalk: string | null;
}

function normalize(data: SpecialEventInput): NormalizedEvent {
  return {
    date: parseIsoDay(data.date),
    endDate: "endDate" in data ? parseIsoDay(data.endDate) : null,
    time: "time" in data ? (data.time ?? null) : null,
    location: "location" in data ? (data.location ?? null) : null,
    theme: "theme" in data ? (data.theme ?? null) : null,
    speaker: "speaker" in data ? (data.speaker ?? null) : null,
    traveler: "traveler" in data ? (data.traveler ?? null) : null,
    serviceTalk: "serviceTalk" in data ? (data.serviceTalk ?? null) : null,
    publicTalk: "publicTalk" in data ? (data.publicTalk ?? null) : null,
    finalTalk: "finalTalk" in data ? (data.finalTalk ?? null) : null,
  };
}

export async function upsertEvent(
  organizationId: string,
  data: SpecialEventInput,
  eventId?: string,
): Promise<{ event?: SpecialEventData; error?: string }> {
  if (eventId) {
    const owned = await prisma.specialEvent.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
    if (!owned) return { error: "Evento não encontrado." };
  }

  const limit = LIMIT_PER_YEAR[data.kind];
  if (limit !== undefined) {
    const year = yearOfUtc(parseIsoDay(data.date));
    const existing = await prisma.specialEvent.count({
      where: {
        organizationId,
        kind: data.kind,
        date: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
        ...(eventId ? { id: { not: eventId } } : {}),
      },
    });
    if (existing >= limit) {
      return { error: limitMessage(data.kind, year) };
    }
  }

  const fields = normalize(data);

  const row = await prisma.specialEvent.upsert({
    where: { id: eventId ?? "__new__" },
    update: {
      kind: data.kind,
      date: fields.date,
      endDate: fields.endDate,
      time: fields.time,
      location: fields.location,
      theme: fields.theme,
      speaker: fields.speaker,
      traveler: fields.traveler,
      serviceTalk: fields.serviceTalk,
      publicTalk: fields.publicTalk,
      finalTalk: fields.finalTalk,
    },
    create: {
      organizationId,
      kind: data.kind,
      date: fields.date,
      endDate: fields.endDate,
      time: fields.time,
      location: fields.location,
      theme: fields.theme,
      speaker: fields.speaker,
      traveler: fields.traveler,
      serviceTalk: fields.serviceTalk,
      publicTalk: fields.publicTalk,
      finalTalk: fields.finalTalk,
    },
  });

  return { event: toEventData(row) };
}

export async function deleteEvent(
  eventId: string,
  organizationId: string,
): Promise<{ deleted?: boolean; error?: string }> {
  const result = await prisma.specialEvent.deleteMany({
    where: { id: eventId, organizationId },
  });
  if (result.count === 0) return { error: "Evento não encontrado." };
  return { deleted: true };
}
