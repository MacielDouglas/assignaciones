import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AssignmentsList } from "@/features/meetings/components/assignments-list";
import {
  type DesignacoesTab,
  DesignacoesTabs,
} from "@/features/meetings/components/designacoes-tabs";
import { MeetingScheduleContent } from "@/features/meetings/components/meeting-schedule-content";
import { getMeetingSchedulePageData } from "@/features/meetings/lib/meeting-page";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManagePeople, isSubUser } from "@/lib/roles";

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

  const params = await searchParams;
  const user = session.user as { id: string; email: string | null };
  const subUser = isSubUser(user.email);
  const tab: DesignacoesTab = params.tab === "designacoes" ? "designacoes" : "reunioes";

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
  const weekParam =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : undefined;
  const data = await getMeetingSchedulePageData(organizationId, weekParam);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-5 py-10 sm:px-6 sm:py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Designações
        </h1>
        <p className="text-muted-foreground max-w-md text-base">
          Programação semanal das reuniões e as designações atribuídas.
        </p>
      </header>

      <Suspense>
        <DesignacoesTabs
          defaultValue={tab}
          reunioes={
            <MeetingScheduleContent
              data={data}
              canEdit={canEdit}
              weekStartIso={data.weekStartIso}
              availableWeeks={data.availableWeeks}
            />
          }
          designacoes={
            <AssignmentsList
              midweekSections={data.midweekSections}
              weekendSections={data.weekendSections}
              assignedNames={data.assignedNames}
              canEdit={canEdit}
              weekStartIso={data.weekStartIso}
              availableWeeks={data.availableWeeks}
            />
          }
        />
      </Suspense>
    </main>
  );
}
