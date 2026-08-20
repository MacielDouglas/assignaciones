import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { type MemberRow, MembersManager } from "@/features/members/components/members-manager";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMembers, isSubUser } from "@/lib/roles";

export default async function MembersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const user = session.user as { id: string; email: string | null };
  const subUser = isSubUser(user.email);

  let organizationId: string;
  let actorRole: MemberRole;

  if (subUser) {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    });
    const first = organizations[0];
    if (!first) redirect("/dashboard");
    organizationId = first.id;
    actorRole = "OWNER";
  } else {
    const membership = await prisma.organizationMember.findUnique({
      where: { userId: user.id },
      include: { organization: true },
    });
    if (!membership) redirect("/welcome");
    if (!canManageMembers(membership.role)) redirect("/dashboard");
    organizationId = membership.organizationId;
    actorRole = membership.role;
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      person: { select: { id: true, nome: true, sexo: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Voltar ao painel">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-medium">Membros</h1>
          <p className="text-muted-foreground text-sm">Usuários e papéis da organização</p>
        </div>
      </div>

      <MembersManager
        organizationId={organizationId}
        actorRole={actorRole}
        currentUserId={user.id}
        initialMembers={members as MemberRow[]}
      />
    </main>
  );
}
