import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MeetingsManager, type MeetingWorkbookRow } from "@/components/meetings-manager";
import { Button } from "@/components/ui/button";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import type { WorkbookContent } from "@/lib/jwpub";
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
  let organizationNames: { id: string; name: string }[] | null = null;

  if (subUser) {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    });
    const first = organizations[0];
    if (!first) redirect("/dashboard");
    organizationId = first.id;
    role = "OWNER";
    organizationNames = organizations;
  } else {
    const membership = await prisma.organizationMember.findUnique({
      where: { userId: user.id },
    });
    if (!membership) redirect("/welcome");
    organizationId = membership.organizationId;
    role = membership.role;
  }

  const canEdit = subUser || canManagePeople(role);

  const [midweek, weekend] = await Promise.all([
    prisma.meetingWorkbook.findMany({
      where: { organizationId, meetingType: "MIDWEEK" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.meetingWorkbook.findMany({
      where: { organizationId, meetingType: "WEEKEND" },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const orgName = organizationNames?.find((org) => org.id === organizationId)?.name;

  const toRow = (workbook: (typeof midweek)[number]): MeetingWorkbookRow => ({
    id: workbook.id,
    symbol: workbook.symbol,
    name: workbook.name,
    meetingType: workbook.meetingType as MeetingWorkbookRow["meetingType"],
    shortTitle: workbook.shortTitle,
    displayTitle: workbook.displayTitle,
    referenceTitle: workbook.referenceTitle,
    languageCode: workbook.languageCode,
    coverImageUrl: workbook.coverImageUrl,
    content: workbook.content as unknown as WorkbookContent,
    updatedAt: workbook.updatedAt.toISOString(),
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/dashboard" aria-label="Voltar ao painel">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-medium">Reuniões</h1>
          <p className="text-muted-foreground text-sm">
            Apostilas de reuniões importadas dos arquivos .jwpub
          </p>
        </div>
      </div>

      {subUser && organizationNames && organizationNames.length > 1 && (
        <p className="text-muted-foreground text-xs">
          Mostrando a organização &quot;{orgName}&quot;.
        </p>
      )}

      <MeetingsManager
        organizationId={organizationId}
        initialMidweek={midweek.map(toRow)}
        initialWeekend={weekend.map(toRow)}
        canEdit={canEdit}
      />
    </main>
  );
}
