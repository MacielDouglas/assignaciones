import type { WorkbookContent, WorkbookWeek } from "@/features/meetings/lib/jwpub";
import {
  articleStartDate,
  buildMidweekMeeting,
  buildWeekendMeeting,
  findWorkbookWeek,
  isoDay,
  type MeetingSection,
  type SongItem,
  type TalkItem,
  type WatchtowerArticleItem,
  weekStartUtc,
} from "@/features/meetings/lib/meeting-builder";
import { listScheduledMeetingsWithNames } from "@/features/meetings/lib/scheduled-meetings";
import { workbookIssueKey } from "@/features/meetings/lib/workbook-meta";
import type { WeekDay } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export interface ScheduleSettingsRow {
  midweekDay: WeekDay | null;
  midweekTime: string | null;
  weekendDay: WeekDay | null;
  weekendTime: string | null;
}

export interface MeetingSchedulePageData {
  weekEntry: {
    workbook: { symbol: string; content: WorkbookContent };
    week: WorkbookWeek;
  } | null;
  scheduleRow: ScheduleSettingsRow | null;
  midweekSections: MeetingSection[];
  weekendSections: MeetingSection[];
  assignedNames: Record<string, string>;
  savedCount: number;
  articleId: string | null;
}

export async function getMeetingSchedulePageData(
  organizationId: string,
): Promise<MeetingSchedulePageData> {
  const [midweekRows, watchtowers, songs, talks, scheduleRow, savedMeetings] = await Promise.all([
    prisma.meetingWorkbook.findMany({
      where: { organizationId, meetingType: "MIDWEEK" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.watchtower.findMany({
      where: { organizationId },
      include: { articles: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.song.findMany({
      where: { organizationId },
      select: { number: true, theme: true },
      orderBy: { number: "asc" },
    }),
    prisma.talk.findMany({
      where: { organizationId },
      select: { number: true, theme: true },
      orderBy: { number: "asc" },
    }),
    prisma.meetingSchedule.findUnique({
      where: { organizationId },
    }),
    listScheduledMeetingsWithNames(organizationId),
  ]);

  const midweekWorkbooks = midweekRows
    .map((row) => ({ symbol: row.symbol, content: row.content as unknown as WorkbookContent }))
    .sort((a, b) => workbookIssueKey(b.symbol) - workbookIssueKey(a.symbol));

  const watchtower =
    watchtowers
      .map((row) => ({
        symbol: row.symbol,
        articles: row.articles.map((article) => ({
          id: article.id,
          title: article.title,
          dates: article.dates,
          openingSong: article.openingSong,
          closingSong: article.closingSong,
        })),
      }))
      .sort((a, b) => workbookIssueKey(b.symbol) - workbookIssueKey(a.symbol))[0] ?? null;

  const weekIso = isoDay(weekStartUtc(new Date()));

  const weekEntry =
    midweekWorkbooks
      .map((workbook) => ({
        workbook,
        week: findWorkbookWeek(workbook.content, workbook.symbol, weekIso),
      }))
      .find(
        (
          entry,
        ): entry is {
          workbook: { symbol: string; content: WorkbookContent };
          week: WorkbookWeek;
        } => entry.week !== null,
      ) ?? null;

  const articles = (watchtower?.articles ?? []) as WatchtowerArticleItem[];
  const articleId =
    articles.find((article) => {
      const date = articleStartDate(article.dates, watchtower?.symbol);
      return date !== null && isoDay(weekStartUtc(date)) === weekIso;
    })?.id ?? null;
  const selectedArticle = articles.find((article) => article.id === articleId) ?? null;

  const songItems = songs as SongItem[];
  const talkItems = talks as TalkItem[];

  const midweekSections = weekEntry
    ? buildMidweekMeeting({
        week: weekEntry.week,
        startTime: scheduleRow?.midweekTime ?? "19:30",
        songs: songItems,
        middleSong: null,
      })
    : [];

  const weekendSections = buildWeekendMeeting({
    startTime: scheduleRow?.weekendTime ?? "09:30",
    songs: songItems,
    talks: talkItems,
    articles,
    selections: {
      openingSong: selectedArticle?.openingSong ?? null,
      middleSong: null,
      closingSong: selectedArticle?.closingSong ?? null,
      talk: talkItems[0]?.number ?? null,
      articleId,
    },
  });

  const savedWeek = savedMeetings.filter((meeting) => meeting.weekStart === weekIso);
  const assignedNames = new Map<string, string>();
  for (const meeting of savedWeek) {
    for (const assignment of meeting.assignments) {
      assignedNames.set(assignment.partId, assignment.personName);
    }
  }

  return {
    weekEntry,
    scheduleRow,
    midweekSections,
    weekendSections,
    assignedNames: Object.fromEntries(assignedNames),
    savedCount: savedWeek.length,
    articleId,
  };
}
