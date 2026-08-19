import { Building2, CalendarDays, KeyRound, UserRound, Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubUser } from "@/lib/roles";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const user = session.user as {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
  };
  const subUser = isSubUser(user.email);

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          _count: { select: { members: true, persons: true, families: true } },
        },
      },
    },
  });

  if (!subUser && !membership) {
    redirect("/welcome");
  }

  const organizations = subUser
    ? await prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { members: true, persons: true } } },
      })
    : null;

  const role = membership?.role;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-12">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuário"} />
            <AvatarFallback>{getInitials(user.name ?? "U")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-muted-foreground truncate text-sm">{user.email}</p>
          </div>
        </div>
        <SignOutButton />
      </header>

      {subUser && (
        <Card>
          <CardHeader>
            <CardTitle>Visão geral</CardTitle>
            <CardDescription>Você tem acesso total ao sistema (sub-user).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Badge>Sub-user</Badge>
            <Badge variant="outline">{organizations?.length ?? 0} organização(ns)</Badge>
          </CardContent>
        </Card>
      )}

      {membership && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" aria-hidden="true" />
              {membership.organization.name}
            </CardTitle>
            <CardDescription>
              {membership.organization._count.members} membro(s) ·{" "}
              {membership.organization._count.persons} pessoa(s) ·{" "}
              {membership.organization._count.families} família(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge>{role ? ROLE_LABEL[role] : role}</Badge>
            <Badge variant="outline">Você é um dos organizadores</Badge>
          </CardContent>
        </Card>
      )}

      {subUser && organizations && organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Organizações</CardTitle>
            <CardDescription>Todas as organizações do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {organizations.map((organization) => (
              <div
                key={organization.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">{organization.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {organization._count.members} membros · {organization._count.persons} pessoas
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <nav className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/pessoas" className="block">
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardContent className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Users className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium">Pessoas</p>
                <p className="text-muted-foreground text-xs">Membros, famílias e designações</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reunioes" className="block">
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardContent className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <CalendarDays className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium">Reuniões</p>
                <p className="text-muted-foreground text-xs">Apostilas importadas dos .jwpub</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {subUser || role === "OWNER" || role === "ADMIN" ? (
          <Link href="/dashboard/membros" className="block">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardContent className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <UserRound className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium">Membros</p>
                  <p className="text-muted-foreground text-xs">Papéis e acesso</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : null}

        {subUser || role === "OWNER" ? (
          <Link href="/dashboard/tokens" className="block">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardContent className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <KeyRound className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tokens</p>
                  <p className="text-muted-foreground text-xs">Convites e acessos</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
