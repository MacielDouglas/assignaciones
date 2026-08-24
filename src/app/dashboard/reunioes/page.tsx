import { CalendarOff, Check, TriangleAlert } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingScheduleCard } from "@/features/meetings/components/meeting-schedule-card";
import { type MeetingTabKey, MeetingTabs } from "@/features/meetings/components/meeting-tabs";
import { MeetingsTopBar } from "@/features/meetings/components/meetings-top-bar";
import { SpecialEventBanner } from "@/features/meetings/components/special-event-banner";
import { SpecialEventCard } from "@/features/meetings/components/special-event-card";
import { getScheduleRoster } from "@/features/meetings/lib/candidates";
import { isoDay, weekStartUtc } from "@/features/meetings/lib/meeting-builder";
import { getMeetingSchedulePageData } from "@/features/meetings/lib/meeting-page";
import { SPECIAL_EVENT_TITLES } from "@/features/meetings/lib/special-events";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManagePeople, isSubUser } from "@/lib/roles";

function parseTab(value: string | undefined): MeetingTabKey {
  return value === "weekend" ? "weekend" : "midweek";
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; week?: string }>;
}) {
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
      select: { id: true },
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

  // Autorização resolvida exclusivamente no servidor; o cliente só recebe o
  // resultado (render ou não dos botões de programar).
  const canEdit = subUser || canManagePeople(role);
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const weekParam =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : undefined;
  const data = await getMeetingSchedulePageData(organizationId, weekParam);
  const { scheduleRow, savedCount, weekEntry } = data;
  // Roster apenas para quem pode editar (modal de edição rápida por parte).
  const roster = canEdit ? await getScheduleRoster(organizationId) : [];
  const basePath = "/dashboard/reunioes";
  const weekHref = (weekIso: string) => `${basePath}?tab=${tab}&week=${weekIso}`;
  const currentWeekIso = isoDay(weekStartUtc(new Date()));
  const programHref = `/dashboard/designacoes/reunioes/programar?week=${data.weekStartIso}`;
  const importHref = "/dashboard/designacoes/reunioes/conteudo";

  const scheduleContent =
    data.specialEvent?.behavior === "hideMeetings" && data.specialEvent ? (
      <SpecialEventCard event={data.specialEvent} />
    ) : (
      <>
        {(savedCount > 0 || !scheduleRow?.midweekTime || !scheduleRow?.weekendTime) && (
          <div className="flex flex-wrap items-center gap-2">
            {(!scheduleRow?.midweekTime || !scheduleRow?.weekendTime) && (
              <Badge className="border-warning/30 bg-warning/10 text-warning">
                <TriangleAlert aria-hidden="true" />
                Horário padrão em uso
              </Badge>
            )}
            {savedCount > 0 && (
              <Badge className="border-success/30 bg-success/10 text-success">
                <Check aria-hidden="true" />
                Programação salva
              </Badge>
            )}
          </div>
        )}
        {data.specialEvent && <SpecialEventBanner event={data.specialEvent} />}
        <MeetingScheduleCard
          title="Reunião do Meio de Semana"
          day={data.effectiveDays.midweekDay}
          time={scheduleRow?.midweekTime ?? null}
          fallbackTime="19:30"
          sections={data.midweekSections}
          assignments={data.assignedNames}
          assignedPersonIds={data.assignedPersonIds}
          canEdit={canEdit}
          programHref={programHref}
          importHref={importHref}
          organizationId={organizationId}
          weekStartIso={data.weekStartIso}
          meetingType="MIDWEEK"
          roster={roster}
        />
      </>
    );

  const weekendContent =
    data.specialEvent?.behavior === "hideMeetings" && data.specialEvent ? (
      <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border px-5 py-10 text-center">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
          <CalendarOff className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Sem reunião nesta semana</p>
          <p className="text-muted-foreground text-sm">
            A semana está ocupada pelo{" "}
            {(
              data.specialEvent.title || SPECIAL_EVENT_TITLES[data.specialEvent.kind]
            ).toLowerCase()}
            .
          </p>
        </div>
      </div>
    ) : (
      <>
        {data.specialEvent && <SpecialEventBanner event={data.specialEvent} />}
        <MeetingScheduleCard
          title="Reunião do Fim de Semana"
          day={data.effectiveDays.weekendDay}
          time={scheduleRow?.weekendTime ?? null}
          fallbackTime="09:30"
          sections={data.weekendSections}
          assignments={data.assignedNames}
          assignedPersonIds={data.assignedPersonIds}
          canEdit={canEdit}
          programHref={programHref}
          importHref={importHref}
          organizationId={organizationId}
          weekStartIso={data.weekStartIso}
          meetingType="WEEKEND"
          roster={roster}
        />
      </>
    );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1">
      <MeetingsTopBar
        weekStartIso={data.weekStartIso}
        makeHref={weekHref}
        currentWeekIso={currentWeekIso}
        bibleReading={weekEntry?.week.BibleReading ?? null}
      />

      <div
        key={`reunioes-${data.weekStartIso}`}
        className="anim-rise-in mx-auto w-full space-y-4 px-4 pt-4 pb-10 sm:px-6 sm:pb-16"
      >
        {!weekEntry ? (
          <Card>
            <CardHeader>
              <CardTitle>Semana sem apostila</CardTitle>
              <CardDescription>
                Nenhuma apostila importada cobre a semana selecionada.
                {canEdit
                  ? " Importe o conteúdo das reuniões para gerar a programação."
                  : " Entre em contato com um organizador para importar o conteúdo."}
              </CardDescription>
            </CardHeader>
            {canEdit && (
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={importHref}>Importar conteúdo</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={programHref}>Programar reunião</Link>
                </Button>
              </CardContent>
            )}
          </Card>
        ) : (
          <section aria-label="Programação da semana">
            <MeetingTabs
              defaultValue={tab}
              basePath={basePath}
              week={data.weekStartIso}
              midweek={scheduleContent}
              weekend={weekendContent}
            />
          </section>
        )}
      </div>
    </main>
  );
}
