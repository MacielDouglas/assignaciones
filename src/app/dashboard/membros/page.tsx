import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type MembersTab, MembersTabs } from "@/components/members-tabs";
import {
  getPeopleAssignmentHistory,
  PERSON_HISTORY_LIMIT,
} from "@/features/meetings/lib/person-history";
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

function formatDateBr(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
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
  const tab: MembersTab =
    params.tab === "convites" || params.tab === "tokens" ? "convites" : "pessoas";

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

  const [unlinkedMembers, tokens, families, availablePeople, people, assignmentHistory] =
    await Promise.all([
      // Acessos sem pessoa vinculada: gerenciados dentro da aba Pessoas.
      prisma.organizationMember.findMany({
        where: { organizationId, personId: null },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
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
      // Consulta única: pessoa + usuário vinculado + função + datas (sem N+1).
      prisma.person.findMany({
        where: { organizationId },
        include: {
          familia: { select: { id: true, name: true } },
          spouse: { select: { id: true, nome: true } },
          marriedTo: { select: { id: true, nome: true } },
          member: {
            select: {
              id: true,
              userId: true,
              role: true,
              createdAt: true,
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
        orderBy: [{ familia: { name: "asc" } }, { nome: "asc" }],
      }),
      getPeopleAssignmentHistory(organizationId),
    ]);

  const historyByPerson = Object.fromEntries(
    Array.from(assignmentHistory.entries()).map(([personId, entries]) => [
      personId,
      entries.slice(0, PERSON_HISTORY_LIMIT).map((entry) => ({
        weekStart: entry.weekStart,
        dateLabel: entry.dateLabel,
        label: entry.label,
        isMidweek: entry.meetingType === "MIDWEEK",
      })),
    ]),
  );

  const peopleRows: PersonRow[] = people.map((person) => ({
    ...person,
    member: person.member
      ? {
          memberId: person.member.id,
          userId: person.member.userId,
          role: person.member.role,
          sinceLabel: formatDateBr(person.member.createdAt),
          user: person.member.user,
        }
      : null,
  }));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-5 py-10 sm:px-6 sm:py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Membros</h1>
        <p className="text-muted-foreground max-w-md text-base">
          Pessoas da congregação, acessos e convites em um só lugar.
        </p>
      </header>

      <MembersTabs
        defaultValue={tab}
        convites={
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
        pessoas={
          <PeopleManager
            organizationId={organizationId}
            initialPeople={peopleRows}
            families={families}
            canEdit
            assignmentHistory={historyByPerson}
            actorRole={actorRole}
            currentUserId={user.id}
            initialUnlinkedMembers={unlinkedMembers.map((member) => ({
              memberId: member.id,
              role: member.role,
              user: member.user,
            }))}
          />
        }
      />
    </main>
  );
}
