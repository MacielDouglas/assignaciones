import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MeetingScheduleManager } from "@/features/meetings/components/meeting-schedule-manager";
import type { WorkbookContent } from "@/features/meetings/lib/jwpub";
import type { SchedulePerson } from "@/features/meetings/lib/meeting-builder";
import { listScheduledMeetings } from "@/features/meetings/lib/scheduled-meetings";
import { workbookIssueKey } from "@/features/meetings/lib/workbook-meta";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManagePeople, isSubUser } from "@/lib/roles";

export default async function ProgramMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
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

  const canEdit = subUser || canManagePeople(role);
  if (!canEdit) {
    redirect("/dashboard/designacoes");
  }

  const params = await searchParams;
  const weekParam =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : undefined;

  const [midweekRows, watchtowers, songs, talks, people, scheduleRow, saved] = await Promise.all([
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
    prisma.person.findMany({
      where: { organizationId, ativo: true },
      select: {
        id: true,
        nome: true,
        ativo: true,
        estudante: true,
        batizado: true,
        sexo: true,
        privilegiosServico: true,
        presidenteNossaVida: true,
        discursoTesouros: true,
        joiasEspirituais: true,
        leituraBiblia: true,
        partesNossaVidaCrista: true,
        estudoBiblicoCongregacao: true,
        leitorEstudoBiblico: true,
        oracao: true,
        presidenteReuniaoPublica: true,
        discursoPublico: true,
        dirigenteEstudoSentinela: true,
        leitorEstudoSentinela: true,
      },
      orderBy: { nome: "asc" },
    }),
    prisma.meetingSchedule.findUnique({
      where: { organizationId },
    }),
    listScheduledMeetings(organizationId),
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
        })),
      }))
      .sort((a, b) => workbookIssueKey(b.symbol) - workbookIssueKey(a.symbol))[0] ?? null;

  const schedule = {
    midweekDay: scheduleRow?.midweekDay ?? null,
    midweekTime: scheduleRow?.midweekTime ?? null,
    weekendDay: scheduleRow?.weekendDay ?? null,
    weekendTime: scheduleRow?.weekendTime ?? null,
  };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <div className="space-y-8">
        <header className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/dashboard/designacoes/reunioes" aria-label="Voltar às reuniões">
              <ArrowLeft />
              Reuniões
            </Link>
          </Button>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Programar reunião
            </h1>
            <p className="text-muted-foreground max-w-md text-base">
              Escolha a semana, as partes e as pessoas designadas. A programação fica salva e
              aparece na página de Reuniões.
            </p>
          </div>
        </header>

        <MeetingScheduleManager
          organizationId={organizationId}
          midweekWorkbooks={midweekWorkbooks}
          watchtower={watchtower}
          schedule={schedule}
          songs={songs}
          talks={talks}
          people={people as SchedulePerson[]}
          canEdit={canEdit}
          today={new Date().toISOString()}
          saved={saved}
          initialDate={weekParam}
        />
      </div>
    </main>
  );
}
