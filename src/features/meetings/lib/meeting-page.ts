import type { WorkbookContent, WorkbookWeek } from "@/features/meetings/lib/jwpub";
import {
  articleStartDate,
  buildMidweekMeeting,
  buildWeekendMeeting,
  findWorkbookWeek,
  isoDay,
  listWorkbookWeeks,
  type MeetingSection,
  parseIsoDay,
  parseSongNumber,
  type SongItem,
  type TalkItem,
  type WatchtowerArticleItem,
  weekStartUtc,
} from "@/features/meetings/lib/meeting-builder";
import { applyOverridesAndRecalc } from "@/features/meetings/lib/part-overrides";
import { listScheduledMeetingsWithNames } from "@/features/meetings/lib/scheduled-meetings";
import {
  effectiveScheduleDays,
  type MeetingSpecialEvent,
} from "@/features/meetings/lib/special-events";
import { findSpecialEventForWeek } from "@/features/meetings/lib/special-events-service";
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
  /** Dias efetivos das reuniões (visita do superintendente move para terça). */
  effectiveDays: { midweekDay: WeekDay | null; weekendDay: WeekDay | null };
  midweekSections: MeetingSection[];
  weekendSections: MeetingSection[];
  assignedNames: Record<string, string>;
  /** IDs das pessoas designadas por slot (para o modal de edição rápida). */
  assignedPersonIds: Record<string, string>;
  savedCount: number;
  articleId: string | null;
  weekStartIso: string;
  availableWeeks: { title: string; date: string }[];
  /** Evento especial da semana (congresso, assembleia ou visita). */
  specialEvent: MeetingSpecialEvent | null;
}

export async function getMeetingSchedulePageData(
  organizationId: string,
  requestedWeekIso?: string,
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

  const weekIso = requestedWeekIso
    ? isoDay(weekStartUtc(parseIsoDay(requestedWeekIso)))
    : isoDay(weekStartUtc(new Date()));

  const specialEvent = await findSpecialEventForWeek(organizationId, weekIso);
  const hideMeetings = specialEvent?.behavior === "hideMeetings";

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

  const rawMidweekSections =
    weekEntry && !hideMeetings
      ? buildMidweekMeeting(
          {
            week: weekEntry.week,
            startTime: scheduleRow?.midweekTime ?? "19:30",
            songs: songItems,
            // Cântico do meio importado da seção Nossa Vida Cristã da apostila.
            middleSong: parseSongNumber(weekEntry.week.meeting.middleSong ?? null),
          },
          { specialEvent },
        )
      : [];

  const rawWeekendSections = hideMeetings
    ? []
    : buildWeekendMeeting(
        {
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
        },
        { specialEvent },
      );

  // Ajustes rápidos (owner/admin) persistidos no JSON da apostila.
  const partOverrides = weekEntry?.workbook.content.partOverrides;
  const midweekSections = applyOverridesAndRecalc(rawMidweekSections, partOverrides, songItems);
  const weekendSections = applyOverridesAndRecalc(rawWeekendSections, partOverrides, songItems);

  const savedWeek = savedMeetings.filter((meeting) => meeting.weekStart === weekIso);
  const assignedNames = new Map<string, string>();
  const assignedPersonIds = new Map<string, string>();
  for (const meeting of savedWeek) {
    for (const assignment of meeting.assignments) {
      assignedNames.set(assignment.partId, assignment.personName);
      assignedPersonIds.set(assignment.partId, assignment.personId);
    }
  }

  return {
    weekEntry,
    scheduleRow,
    effectiveDays: effectiveScheduleDays(
      {
        midweekDay: scheduleRow?.midweekDay ?? null,
        weekendDay: scheduleRow?.weekendDay ?? null,
      },
      specialEvent,
    ),
    midweekSections,
    weekendSections,
    assignedNames: Object.fromEntries(assignedNames),
    assignedPersonIds: Object.fromEntries(assignedPersonIds),
    savedCount: savedWeek.length,
    articleId,
    weekStartIso: weekIso,
    availableWeeks: midweekWorkbooks.flatMap((wb) => listWorkbookWeeks(wb.content, wb.symbol)),
    specialEvent,
  };
}
