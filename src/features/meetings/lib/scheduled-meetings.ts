import { addDaysUtc, isoDay, parseIsoDay } from "@/features/meetings/lib/meeting-builder";
import type { ScheduledMeetingInput } from "@/features/meetings/schemas";
import type { PrismaClient } from "@/generated/prisma/client";
import type { MeetingType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export interface ScheduledAssignmentData {
  partId: string;
  label: string;
  personId: string;
}

export interface ScheduledMeetingData {
  id: string;
  weekStart: string;
  meetingType: MeetingType;
  middleSong: number | null;
  openingSong: number | null;
  closingSong: number | null;
  talkNumber: number | null;
  articleId: string | null;
  assignments: ScheduledAssignmentData[];
}

export interface ScheduledMeetingWithNames {
  id: string;
  weekStart: string;
  meetingType: MeetingType;
  middleSong: number | null;
  openingSong: number | null;
  closingSong: number | null;
  talkNumber: number | null;
  articleId: string | null;
  assignments: { partId: string; label: string; personId: string; personName: string }[];
}

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Mantém o campo denormalizado Person.lastAssignmentDate em sincronia com as
 * designações salvas (semanas já iniciadas ou passadas). Usado para ordenar
 * candidatos por prioridade sem varrer toda a tabela de designações.
 */
export async function syncLastAssignmentDate(
  tx: PrismaClient | TransactionClient,
  personIds: string[],
): Promise<void> {
  if (personIds.length === 0) return;

  const rows = await tx.scheduledAssignment.findMany({
    where: {
      personId: { in: personIds },
      scheduledMeeting: { weekStart: { lte: startOfTodayUtc() } },
    },
    select: { personId: true, scheduledMeeting: { select: { weekStart: true } } },
  });

  const latest = new Map<string, Date>();
  for (const row of rows) {
    const current = latest.get(row.personId);
    const weekStart = row.scheduledMeeting.weekStart;
    if (!current || weekStart > current) latest.set(row.personId, weekStart);
  }

  for (const personId of personIds) {
    await tx.person.update({
      where: { id: personId },
      data: { lastAssignmentDate: latest.get(personId) ?? null },
    });
  }
}

function toData(row: {
  id: string;
  weekStart: Date;
  meetingType: MeetingType;
  middleSong: number | null;
  openingSong: number | null;
  closingSong: number | null;
  talkNumber: number | null;
  articleId: string | null;
  assignments: { partId: string; label: string; personId: string }[];
}): ScheduledMeetingData {
  return {
    id: row.id,
    weekStart: isoDay(row.weekStart),
    meetingType: row.meetingType,
    middleSong: row.middleSong,
    openingSong: row.openingSong,
    closingSong: row.closingSong,
    talkNumber: row.talkNumber,
    articleId: row.articleId,
    assignments: row.assignments.map((assignment) => ({
      partId: assignment.partId,
      label: assignment.label,
      personId: assignment.personId,
    })),
  };
}

export async function listScheduledMeetings(
  organizationId: string,
): Promise<ScheduledMeetingData[]> {
  const rows = await prisma.scheduledMeeting.findMany({
    where: { organizationId },
    include: {
      assignments: {
        select: { partId: true, label: true, personId: true },
        orderBy: { partId: "asc" },
      },
    },
    orderBy: { weekStart: "asc" },
  });
  return rows.map(toData);
}

export async function listScheduledMeetingsWithNames(
  organizationId: string,
): Promise<ScheduledMeetingWithNames[]> {
  const rows = await prisma.scheduledMeeting.findMany({
    where: { organizationId },
    include: {
      assignments: {
        include: { person: { select: { nome: true } } },
        orderBy: { partId: "asc" },
      },
    },
    orderBy: { weekStart: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    weekStart: isoDay(row.weekStart),
    meetingType: row.meetingType,
    middleSong: row.middleSong,
    openingSong: row.openingSong,
    closingSong: row.closingSong,
    talkNumber: row.talkNumber,
    articleId: row.articleId,
    assignments: row.assignments.map((assignment) => ({
      partId: assignment.partId,
      label: assignment.label,
      personId: assignment.personId,
      personName: assignment.person.nome,
    })),
  }));
}

export async function saveScheduledMeeting(
  organizationId: string,
  input: ScheduledMeetingInput,
): Promise<ScheduledMeetingData> {
  const weekStart = parseIsoDay(input.weekStart);
  const affectedPersonIds = [...new Set(input.assignments.map((item) => item.personId))];

  const row = await prisma.$transaction(async (tx) => {
    // Pessoas que tinham partes na versão anterior também podem ter a data alterada.
    const previous = await tx.scheduledMeeting.findUnique({
      where: {
        organizationId_weekStart_meetingType: {
          organizationId,
          weekStart,
          meetingType: input.meetingType,
        },
      },
      select: { assignments: { select: { personId: true } } },
    });
    for (const personId of previous?.assignments.map((a) => a.personId) ?? []) {
      if (!affectedPersonIds.includes(personId)) affectedPersonIds.push(personId);
    }

    const saved = await tx.scheduledMeeting.upsert({
      where: {
        organizationId_weekStart_meetingType: {
          organizationId,
          weekStart,
          meetingType: input.meetingType,
        },
      },
      create: {
        organizationId,
        weekStart,
        meetingType: input.meetingType,
        middleSong: input.middleSong,
        openingSong: input.openingSong,
        closingSong: input.closingSong,
        talkNumber: input.talkNumber,
        articleId: input.articleId,
        assignments: {
          create: input.assignments.map((assignment) => ({
            partId: assignment.partId,
            label: assignment.label,
            personId: assignment.personId,
          })),
        },
      },
      update: {
        middleSong: input.middleSong,
        openingSong: input.openingSong,
        closingSong: input.closingSong,
        talkNumber: input.talkNumber,
        articleId: input.articleId,
        assignments: {
          deleteMany: {},
          create: input.assignments.map((assignment) => ({
            partId: assignment.partId,
            label: assignment.label,
            personId: assignment.personId,
          })),
        },
      },
      include: {
        assignments: {
          select: { partId: true, label: true, personId: true },
          orderBy: { partId: "asc" },
        },
      },
    });

    await syncLastAssignmentDate(tx, affectedPersonIds);
    return saved;
  });

  return toData(row);
}

export async function deleteScheduledWeek(
  organizationId: string,
  weekStartIso: string,
): Promise<void> {
  const start = parseIsoDay(weekStartIso);

  await prisma.$transaction(async (tx) => {
    const meetings = await tx.scheduledMeeting.findMany({
      where: { organizationId, weekStart: { gte: start, lt: addDaysUtc(start, 1) } },
      select: { id: true, assignments: { select: { personId: true } } },
    });
    const affectedPersonIds = [
      ...new Set(meetings.flatMap((meeting) => meeting.assignments.map((a) => a.personId))),
    ];

    await tx.scheduledMeeting.deleteMany({
      where: {
        organizationId,
        id: { in: meetings.map((meeting) => meeting.id) },
      },
    });

    await syncLastAssignmentDate(tx, affectedPersonIds);
  });
}
