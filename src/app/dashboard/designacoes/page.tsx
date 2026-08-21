import { CalendarCog, Check, TriangleAlert } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignmentsList } from "@/features/meetings/components/assignments-list";
import { DesignacoesAreaSwitcher } from "@/features/meetings/components/designacoes-area-switcher";
import { MeetingScheduleTable } from "@/features/meetings/components/meeting-schedule-table";
import type { DesignacoesArea } from "@/features/meetings/components/types";
import { WeekNav } from "@/features/meetings/components/week-nav";
import { isoDay, weekStartUtc } from "@/features/meetings/lib/meeting-builder";
import { getMeetingSchedulePageData } from "@/features/meetings/lib/meeting-page";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManagePeople, isSubUser } from "@/lib/roles";

function parseArea(value: string | undefined): DesignacoesArea {
  return value === "designacoes" ? "designacoes" : "reunioes";
}

export default async function DesignacoesPage({
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

  // Autorização resolvida exclusivamente no servidor; o cliente só recebe o
  // resultado (render ou não do botão) — nenhuma checagem de papel no browser.
  const canEdit = subUser || canManagePeople(role);
  const params = await searchParams;
  const area = parseArea(params.tab);
  const weekParam =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : undefined;
  const data = await getMeetingSchedulePageData(organizationId, weekParam);
  const { scheduleRow, savedCount, weekEntry } = data;
  const areaHref = (next: DesignacoesArea) =>
    `/dashboard/designacoes?tab=${next}&week=${data.weekStartIso}`;
  const weekHref = (weekIso: string) => `/dashboard/designacoes?tab=${area}&week=${weekIso}`;
  const currentWeekIso = isoDay(weekStartUtc(new Date()));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6 sm:py-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Designações
          </h1>
          <p className="text-muted-foreground max-w-md text-base">
            Consulte a programação das reuniões e as designações da congregação semana a semana.
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/dashboard/designacoes/reunioes/programar?week=${data.weekStartIso}`}>
              <CalendarCog aria-hidden="true" />
              Programar reunião
            </Link>
          </Button>
        )}
      </header>

      <DesignacoesAreaSwitcher active={area} makeHref={areaHref} />

      {area === "reunioes" &&
        (weekEntry ? (
          <section aria-label="Programação da semana">
            <div key={`reunioes-${data.weekStartIso}`} className="anim-rise-in space-y-6">
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

              <WeekNav
                weekStartIso={data.weekStartIso}
                makeHref={weekHref}
                currentWeekIso={currentWeekIso}
              />

              <MeetingScheduleTable
                title="Reunião do Meio de Semana"
                day={scheduleRow?.midweekDay ?? null}
                time={scheduleRow?.midweekTime ?? null}
                fallbackTime="19:30"
                sections={data.midweekSections}
                assignments={data.assignedNames}
              />
              <MeetingScheduleTable
                title="Reunião do Fim de Semana"
                day={scheduleRow?.weekendDay ?? null}
                time={scheduleRow?.weekendTime ?? null}
                fallbackTime="09:30"
                sections={data.weekendSections}
                assignments={data.assignedNames}
              />
            </div>
          </section>
        ) : (
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
              <CardContent>
                <Button asChild>
                  <Link href="/dashboard/designacoes/reunioes/conteudo">Importar conteúdo</Link>
                </Button>
              </CardContent>
            )}
          </Card>
        ))}

      {area === "designacoes" && (
        <section aria-label="Designações da semana">
          <div key={`designacoes-${data.weekStartIso}`} className="anim-rise-in space-y-6">
            <WeekNav
              weekStartIso={data.weekStartIso}
              makeHref={weekHref}
              currentWeekIso={currentWeekIso}
            />
            <AssignmentsList
              midweekSections={data.midweekSections}
              weekendSections={data.weekendSections}
              assignedNames={data.assignedNames}
              canEdit={canEdit}
            />
          </div>
        </section>
      )}
    </main>
  );
}
