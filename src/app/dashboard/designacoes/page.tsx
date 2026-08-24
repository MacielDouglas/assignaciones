import { CalendarCog, CalendarDays } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AssignmentsList } from "@/features/meetings/components/assignments-list";
import { SpecialEventBanner } from "@/features/meetings/components/special-event-banner";
import { SpecialEventCard } from "@/features/meetings/components/special-event-card";
import { WeekNav } from "@/features/meetings/components/week-nav";
import { isoDay, weekStartUtc } from "@/features/meetings/lib/meeting-builder";
import { getMeetingSchedulePageData } from "@/features/meetings/lib/meeting-page";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManagePeople, isSubUser } from "@/lib/roles";

export default async function DesignacoesPage({
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

  // Autorização resolvida exclusivamente no servidor.
  const canEdit = subUser || canManagePeople(role);
  const params = await searchParams;
  const weekParam =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : undefined;
  const data = await getMeetingSchedulePageData(organizationId, weekParam);
  const weekHref = (weekIso: string) => `/dashboard/designacoes?week=${weekIso}`;
  const currentWeekIso = isoDay(weekStartUtc(new Date()));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6 sm:py-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Designações
          </h1>
          <p className="text-muted-foreground max-w-md text-base">
            Designações da congregação semana a semana.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/reunioes?week=${data.weekStartIso}`}>
              <CalendarDays aria-hidden="true" />
              Ver reuniões
            </Link>
          </Button>
          {canEdit && (
            <Button asChild>
              <Link href={`/dashboard/designacoes/reunioes/programar?week=${data.weekStartIso}`}>
                <CalendarCog aria-hidden="true" />
                Programar
              </Link>
            </Button>
          )}
        </div>
      </header>

      <section aria-label="Designações da semana">
        <div key={`designacoes-${data.weekStartIso}`} className="anim-rise-in space-y-4">
          <WeekNav
            weekStartIso={data.weekStartIso}
            makeHref={weekHref}
            currentWeekIso={currentWeekIso}
          />
          {data.specialEvent?.behavior === "hideMeetings" ? (
            <SpecialEventCard event={data.specialEvent} />
          ) : (
            <>
              {data.specialEvent && <SpecialEventBanner event={data.specialEvent} />}
              <AssignmentsList
                midweekSections={data.midweekSections}
                weekendSections={data.weekendSections}
                assignedNames={data.assignedNames}
                canEdit={canEdit}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
