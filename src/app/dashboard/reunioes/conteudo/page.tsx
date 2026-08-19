import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MeetingsManager,
  type MeetingWorkbookRow,
  type WatchtowerRow,
} from "@/components/meetings-manager";
import { Button } from "@/components/ui/button";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import type { WorkbookContent } from "@/lib/jwpub";
import { pruneMeetings } from "@/lib/meetings";
import { prisma } from "@/lib/prisma";
import { canManagePeople, isSubUser } from "@/lib/roles";
import { migrateLegacyWatchtowers, pruneWatchtowers } from "@/lib/watchtowers";
import { workbookIssueKey } from "@/lib/workbook-meta";

export default async function MeetingContentPage() {
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

  await Promise.all([
    pruneMeetings(organizationId),
    pruneWatchtowers(organizationId),
    migrateLegacyWatchtowers(organizationId),
  ]);

  const [midweek, watchtowers] = await Promise.all([
    prisma.meetingWorkbook.findMany({
      where: { organizationId, meetingType: "MIDWEEK" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.watchtower.findMany({
      where: { organizationId },
      include: { articles: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const sortByIssue = (list: typeof midweek) =>
    [...list].sort((a, b) => workbookIssueKey(b.symbol) - workbookIssueKey(a.symbol));
  const sortWatchtowers = (list: typeof watchtowers) =>
    [...list].sort((a, b) => workbookIssueKey(b.symbol) - workbookIssueKey(a.symbol));

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

  const toWatchtowerRow = (watchtower: (typeof watchtowers)[number]): WatchtowerRow => ({
    id: watchtower.id,
    symbol: watchtower.symbol,
    name: watchtower.name,
    languageCode: watchtower.languageCode,
    fileName: watchtower.fileName,
    updatedAt: watchtower.updatedAt.toISOString(),
    articles: watchtower.articles.map((article) => ({
      title: article.title,
      dates: article.dates ?? undefined,
      color: article.color ?? undefined,
      openingSong: article.openingSong ?? undefined,
      closingSong: article.closingSong ?? undefined,
    })),
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <div className="space-y-8">
        <header className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/dashboard" aria-label="Voltar ao painel">
              <ArrowLeft />
              Painel
            </Link>
          </Button>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Conteúdo das reuniões
            </h1>
            <p className="text-muted-foreground max-w-md text-base">
              Apostilas importadas dos arquivos .jwpub, prontas para montar a escala da congregação.
            </p>
          </div>
        </header>

        {subUser && organizationNames && organizationNames.length > 1 && (
          <p className="text-muted-foreground text-sm">
            Mostrando a organização &quot;{orgName}&quot;.
          </p>
        )}

        <MeetingsManager
          organizationId={organizationId}
          initialMidweek={sortByIssue(midweek).map(toRow)}
          initialWatchtowers={sortWatchtowers(watchtowers).map(toWatchtowerRow)}
          canEdit={canEdit}
        />
      </div>
    </main>
  );
}
