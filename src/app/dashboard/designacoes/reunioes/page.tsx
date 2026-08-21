import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MeetingScheduleContent } from "@/features/meetings/components/meeting-schedule-content";
import { getMeetingSchedulePageData } from "@/features/meetings/lib/meeting-page";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManagePeople, isSubUser } from "@/lib/roles";

export default async function MeetingsPage({
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
  const params = await searchParams;
  const weekParam =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : undefined;
  const data = await getMeetingSchedulePageData(organizationId, weekParam);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-5 py-10 sm:px-6 sm:py-16">
      <header className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/dashboard/designacoes">
            <ArrowLeft aria-hidden="true" />
            Designações
          </Link>
        </Button>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Reuniões</h1>
          <p className="text-muted-foreground max-w-md text-base">
            Programação semanal gerada a partir da apostila e das configurações.
          </p>
        </div>
      </header>

      <MeetingScheduleContent
        data={data}
        canEdit={canEdit}
        weekStartIso={data.weekStartIso}
        availableWeeks={data.availableWeeks}
      />
    </main>
  );
}
