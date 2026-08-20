import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MembersTabs } from "@/components/members-tabs";
import { type MemberRow, MembersManager } from "@/features/members/components/members-manager";
import { PeopleManager, type PersonRow } from "@/features/people/components/people-manager";
import { type TokenRow, TokensManager } from "@/features/tokens/components/tokens-manager";
import { isTokenExpired, isTokenUsed } from "@/features/tokens/lib/tokens";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMembers, isSubUser } from "@/lib/roles";

function statusOf(usedAt: Date | null, expiresAt: Date) {
  if (isTokenUsed(usedAt)) return "USED" as const;
  if (isTokenExpired(expiresAt)) return "EXPIRED" as const;
  return "ACTIVE" as const;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const user = session.user as { id: string; email: string | null };
  const subUser = isSubUser(user.email);
  const params = await searchParams;
  const tab =
    params.tab === "tokens" ? "tokens" : params.tab === "pessoas" ? "pessoas" : "usuarios";

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

  const [members, tokens, families, availablePeople, people] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        person: { select: { id: true, nome: true, sexo: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.inviteToken.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        usedBy: { select: { id: true, name: true, email: true } },
        person: { select: { id: true, nome: true } },
      },
    }),
    prisma.family.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.person.findMany({
      where: {
        organizationId,
        member: { is: null },
        inviteToken: { is: null },
      },
      include: {
        familia: { select: { id: true, name: true } },
      },
      orderBy: { nome: "asc" },
    }),
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
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-5 py-10 sm:px-6 sm:py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Membros</h1>
        <p className="text-muted-foreground max-w-md text-base">
          Convites, usuários e pessoas da organização.
        </p>
      </header>

      <MembersTabs
        defaultValue={tab}
        tokens={
          <TokensManager
            canCreateOrgTokens={subUser}
            canCreateInviteTokens
            families={families}
            availablePeople={availablePeople}
            initialTokens={
              tokens.map((token) => ({
                id: token.id,
                type: token.type,
                status: statusOf(token.usedAt, token.expiresAt),
                createdAt: token.createdAt.toISOString(),
                expiresAt: token.expiresAt.toISOString(),
                usedAt: token.usedAt?.toISOString() ?? null,
                organization: token.organization,
                createdBy: token.createdBy,
                usedBy: token.usedBy,
                person: token.person,
              })) as TokenRow[]
            }
          />
        }
        usuarios={
          <MembersManager
            organizationId={organizationId}
            actorRole={actorRole}
            currentUserId={user.id}
            initialMembers={members as MemberRow[]}
          />
        }
        pessoas={
          <PeopleManager
            organizationId={organizationId}
            initialPeople={people as PersonRow[]}
            families={families}
            canEdit
          />
        }
      />
    </main>
  );
}
