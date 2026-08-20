import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MeetingScheduleManager } from "@/features/meetings/components/meeting-schedule-manager";
import type { WorkbookContent } from "@/features/meetings/lib/jwpub";
import type { SchedulePerson } from "@/features/meetings/lib/meeting-builder";
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

  const [midweekRows, watchtowers, songs, talks, people, scheduleRow] = await Promise.all([
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
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Voltar ao painel">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-medium">Reuniões</h1>
          <p className="text-muted-foreground text-sm">
            Programação da semana gerada a partir da apostila e das configurações
          </p>
        </div>
      </div>

      <MeetingScheduleManager
        midweekWorkbooks={midweekWorkbooks}
        watchtower={watchtower}
        schedule={schedule}
        songs={songs}
        talks={talks}
        people={people as SchedulePerson[]}
        canEdit={canEdit}
        today={new Date().toISOString()}
      />
    </main>
  );
}
