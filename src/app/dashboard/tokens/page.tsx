import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { type TokenRow, TokensManager } from "@/features/tokens/components/tokens-manager";
import { isTokenExpired, isTokenUsed } from "@/features/tokens/lib/tokens";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageTokens, isSubUser } from "@/lib/roles";

function statusOf(usedAt: Date | null, expiresAt: Date) {
  if (isTokenUsed(usedAt)) return "USED" as const;
  if (isTokenExpired(expiresAt)) return "EXPIRED" as const;
  return "ACTIVE" as const;
}

export default async function TokensPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const user = session.user as { id: string; email: string | null };
  const subUser = isSubUser(user.email);

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: user.id },
    include: { organization: true },
  });

  let organizationId: string | null;
  let orgName: string | null = null;

  if (subUser) {
    organizationId = null;
  } else {
    if (!membership) redirect("/welcome");
    if (!canManageTokens(membership.role)) redirect("/dashboard");
    organizationId = membership.organizationId;
    orgName = membership.organization.name;
  }

  const canCreateOrgTokens = subUser;
  const canCreateInviteTokens = subUser || organizationId !== null;

  if (!canCreateOrgTokens && !canCreateInviteTokens) {
    redirect("/dashboard");
  }

  const [tokens, families, availablePeople] = await Promise.all([
    prisma.inviteToken.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        usedBy: { select: { id: true, name: true, email: true } },
        person: { select: { id: true, nome: true } },
      },
    }),
    organizationId
      ? prisma.family.findMany({
          where: { organizationId },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    organizationId
      ? prisma.person.findMany({
          where: {
            organizationId,
            member: { is: null },
            inviteToken: { is: null },
          },
          include: {
            familia: { select: { id: true, name: true } },
          },
          orderBy: { nome: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const orgNameLabel = orgName ?? "a organização";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Voltar ao painel">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-medium">Tokens</h1>
          <p className="text-muted-foreground text-sm">
            {subUser ? "Convites para criar organizações" : `Convites para ${orgNameLabel}`}
          </p>
        </div>
      </div>

      <TokensManager
        canCreateOrgTokens={canCreateOrgTokens}
        canCreateInviteTokens={canCreateInviteTokens}
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
    </main>
  );
}
