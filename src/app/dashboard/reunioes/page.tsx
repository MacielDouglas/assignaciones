import { CalendarCog } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingScheduleTable } from "@/features/meetings/components/meeting-schedule-table";
import { MeetingTabs } from "@/features/meetings/components/meeting-tabs";
import type { WorkbookContent, WorkbookWeek } from "@/features/meetings/lib/jwpub";
import {
  articleStartDate,
  buildMidweekMeeting,
  buildWeekendMeeting,
  findWorkbookWeek,
  isoDay,
  type SongItem,
  type TalkItem,
  type WatchtowerArticleItem,
  weekStartUtc,
} from "@/features/meetings/lib/meeting-builder";
import { listScheduledMeetingsWithNames } from "@/features/meetings/lib/scheduled-meetings";
import { workbookIssueKey } from "@/features/meetings/lib/workbook-meta";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManagePeople, isSubUser } from "@/lib/roles";

export default async function MeetingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const user = session.user as { id: string; email: string | null };
  const subUser = isSubUser(user.email);

  let organizationId: string;
  let role: MemberRole;

  if (subUser) {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    });
    const first = organizations[0];
    if (!first) redirect("/dashboard");
    organizationId = first.id;
    role = "OWNER";
  } else {
    const membership = await prisma.organizationMember.findUnique({
      where: { userId: user.id },
    });
    if (!membership) redirect("/welcome");
    organizationId = membership.organizationId;
    role = membership.role;
  }

  const canEdit = subUser || canManagePeople(role);

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

  const midweekTable = (
    <MeetingScheduleTable
      title="Meio de Semana"
      day={scheduleRow?.midweekDay ?? null}
      time={scheduleRow?.midweekTime ?? null}
      fallbackTime="19:30"
      sections={midweekSections}
      assignments={Object.fromEntries(assignedNames)}
    />
  );

  const weekendTable = (
    <MeetingScheduleTable
      title="Fim de Semana"
      day={scheduleRow?.weekendDay ?? null}
      time={scheduleRow?.weekendTime ?? null}
      fallbackTime="09:30"
      sections={weekendSections}
      assignments={Object.fromEntries(assignedNames)}
    />
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <div className="space-y-8">
        <header className="space-y-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Reuniões
            </h1>
            <p className="text-muted-foreground max-w-md text-base">
              Programação semanal gerada a partir da apostila e das configurações.
            </p>
          </div>
        </header>

        {weekEntry ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Semana de {weekEntry.week.week}</Badge>
              {(!scheduleRow?.midweekTime || !scheduleRow?.weekendTime) && (
                <Badge variant="outline">Horário padrão em uso</Badge>
              )}
              {savedWeek.length > 0 && <Badge variant="outline">Programação salva</Badge>}
              {canEdit && (
                <Button variant="outline" size="sm" className="ml-auto" asChild>
                  <Link href="/dashboard/reunioes/programar">
                    <CalendarCog aria-hidden="true" />
                    Programar reunião
                  </Link>
                </Button>
              )}
            </div>

            <MeetingTabs midweek={midweekTable} weekend={weekendTable} />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Semana sem apostila</CardTitle>
              <CardDescription>
                Nenhuma apostila importada cobre a semana atual. Importe o conteúdo das reuniões
                para gerar a programação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/reunioes/conteudo">Importar conteúdo</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
