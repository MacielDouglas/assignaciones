import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SettingsManager } from "@/features/settings/components/settings-manager";
import {
  getGeneralSectors,
  getSectors,
  getWeeklyCleaning,
  getWeeklySectors,
  listGeneralCleanings,
} from "@/features/settings/lib/cleaning-data";
import { getSchedule, listEvents } from "@/features/settings/lib/events";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings, isSubUser } from "@/lib/roles";

export default async function SettingsPage() {
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

  const canEdit = subUser || canManageSettings(role);

  const [schedule, events, sectors, weekly, weeklySectors, general, generalSectors] =
    await Promise.all([
      getSchedule(organizationId),
      listEvents(organizationId),
      getSectors(organizationId),
      getWeeklyCleaning(organizationId),
      getWeeklySectors(organizationId),
      listGeneralCleanings(organizationId),
      getGeneralSectors(organizationId),
    ]);

  const orgName = organizationNames?.find((org) => org.id === organizationId)?.name;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-5 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Voltar ao painel">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-medium">Configurações</h1>
          <p className="text-muted-foreground text-sm">
            Reuniões, eventos especiais e limpeza da congregação
          </p>
        </div>
      </div>

      {subUser && organizationNames && organizationNames.length > 1 && (
        <p className="text-muted-foreground text-xs">
          Mostrando a organização &quot;{orgName}&quot;.
        </p>
      )}

      {!canEdit && (
        <p className="text-muted-foreground text-xs">
          Você pode visualizar as configurações. Apenas owners e admins podem alterar.
        </p>
      )}

      <SettingsManager
        organizationId={organizationId}
        initialSchedule={schedule}
        initialEvents={events}
        initialSectors={sectors}
        initialWeekly={weekly}
        initialWeeklySectors={weeklySectors}
        initialGeneral={general}
        initialGeneralSectors={generalSectors}
        today={new Date().toISOString()}
        canEdit={canEdit}
      />
    </main>
  );
}
