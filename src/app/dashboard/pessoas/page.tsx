import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PeopleManager, type PersonRow } from "@/components/people-manager";
import { Button } from "@/components/ui/button";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManagePeople, isSubUser } from "@/lib/roles";

export default async function PeoplePage() {
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

  const [people, families] = await Promise.all([
    prisma.person.findMany({
      where: { organizationId },
      include: {
        familia: { select: { id: true, name: true } },
        spouse: { select: { id: true, nome: true } },
        marriedTo: { select: { id: true, nome: true } },
        member: { select: { id: true, userId: true, role: true } },
      },
      orderBy: [{ familia: { name: "asc" } }, { nome: "asc" }],
    }),
    prisma.family.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const orgName = organizationNames?.find((org) => org.id === organizationId)?.name;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/dashboard" aria-label="Voltar ao painel">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-medium">Pessoas</h1>
          <p className="text-muted-foreground text-sm">
            Membros, famílias e privilégios da organização
          </p>
        </div>
      </div>

      {subUser && organizationNames && organizationNames.length > 1 && (
        <p className="text-muted-foreground text-xs">
          Mostrando a organização &quot;{orgName}&quot;.
        </p>
      )}

      <PeopleManager
        organizationId={organizationId}
        initialPeople={people as PersonRow[]}
        families={families}
        canEdit={canEdit}
      />
    </main>
  );
}
