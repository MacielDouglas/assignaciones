import type { Prisma } from "@/generated/prisma/client";
import type { MeetingType } from "@/generated/prisma/enums";
import type { WorkbookContent } from "@/lib/jwpub";
import { prisma } from "@/lib/prisma";

export interface MeetingSaveInput {
  meetingType: MeetingType;
  symbol: string;
  name: string;
  shortTitle?: string;
  displayTitle?: string;
  referenceTitle?: string;
  languageCode?: string;
  coverImageUrl?: string;
  content: WorkbookContent;
}

export async function listMeetings(organizationId: string, meetingType: MeetingType) {
  return prisma.meetingWorkbook.findMany({
    where: { organizationId, meetingType },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getMeeting(meetingId: string, organizationId: string) {
  return prisma.meetingWorkbook.findFirst({
    where: { id: meetingId, organizationId },
  });
}

function toJsonValue(content: WorkbookContent): Prisma.InputJsonValue {
  return content as unknown as Prisma.InputJsonValue;
}

export async function upsertMeeting(organizationId: string, data: MeetingSaveInput) {
  return prisma.meetingWorkbook.upsert({
    where: {
      organizationId_meetingType_symbol: {
        organizationId,
        meetingType: data.meetingType,
        symbol: data.symbol,
      },
    },
    update: {
      name: data.name,
      shortTitle: data.shortTitle ?? null,
      displayTitle: data.displayTitle ?? null,
      referenceTitle: data.referenceTitle ?? null,
      languageCode: data.languageCode ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
      content: toJsonValue(data.content),
    },
    create: {
      organizationId,
      meetingType: data.meetingType,
      symbol: data.symbol,
      name: data.name,
      shortTitle: data.shortTitle ?? null,
      displayTitle: data.displayTitle ?? null,
      referenceTitle: data.referenceTitle ?? null,
      languageCode: data.languageCode ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
      content: toJsonValue(data.content),
    },
  });
}

export async function updateMeeting(
  meetingId: string,
  _organizationId: string,
  data: {
    name?: string;
    coverImageUrl?: string | null;
    content?: WorkbookContent;
  },
) {
  return prisma.meetingWorkbook.update({
    where: { id: meetingId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl } : {}),
      ...(data.content !== undefined ? { content: toJsonValue(data.content) } : {}),
    },
    select: { id: true, name: true, symbol: true, meetingType: true },
  });
}

export async function deleteMeeting(meetingId: string, organizationId: string) {
  return prisma.meetingWorkbook.deleteMany({
    where: { id: meetingId, organizationId },
  });
}
