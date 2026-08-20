import { addDaysUtc, isoDay, parseIsoDay } from "@/features/meetings/lib/meeting-builder";
import type { ScheduledMeetingInput } from "@/features/meetings/schemas";
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
  const row = await prisma.scheduledMeeting.upsert({
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
  return toData(row);
}

export async function deleteScheduledWeek(
  organizationId: string,
  weekStartIso: string,
): Promise<void> {
  const start = parseIsoDay(weekStartIso);
  await prisma.scheduledMeeting.deleteMany({
    where: {
      organizationId,
      weekStart: { gte: start, lt: addDaysUtc(start, 1) },
    },
  });
}
