import {
  Briefcase,
  Building2,
  CalendarDays,
  KeyRound,
  Settings,
  Sparkles,
  SprayCan,
  UserRound,
  Users,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceholderSection } from "@/features/meetings/components/dashboard/placeholder-section";
import { UpcomingAssignmentsCard } from "@/features/meetings/components/dashboard/upcoming-assignments-card";
import { WeeklyAssignmentsCard } from "@/features/meetings/components/dashboard/weekly-assignments-card";
import { getUserWeekAssignments } from "@/features/meetings/lib/user-assignments";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubUser } from "@/lib/roles";

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
  };
  const subUser = isSubUser(user.email);

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: user.id },
    include: {
      person: { select: { id: true, sexo: true, ativo: true } },
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
        select: { id: true, name: true, _count: { select: { members: true, persons: true } } },
      })
    : null;

  const role = membership?.role;
  const linkedPerson = membership?.person ?? null;

  // Designações do publicador vinculado (semana atual + próxima), em
  // consultas otimizadas; null quando o usuário não tem pessoa vinculada.
  const weekAssignments =
    membership && linkedPerson && linkedPerson.ativo
      ? await getUserWeekAssignments(membership.organizationId, linkedPerson.id)
      : { current: [], next: [] };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          Olá{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Aqui está um resumo das suas designações.
        </p>
      </header>

      <section aria-label="Minhas designações da semana" className="anim-rise-in space-y-6">
        <WeeklyAssignmentsCard items={weekAssignments.current} />
        <UpcomingAssignmentsCard items={weekAssignments.next} />
      </section>

      <section aria-label="Outras designações" className="space-y-3">
        {linkedPerson?.sexo === "MALE" && (
          <PlaceholderSection
            icon={Briefcase}
            title="Designações de Trabalho"
            description="Em breve."
          />
        )}
        <PlaceholderSection
          icon={SprayCan}
          title="Designações de Limpeza"
          description="Em breve."
        />
      </section>

      {(membership || subUser) && (
        <section aria-label="Atalhos" className="space-y-3 pt-2">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Gerenciar
          </p>
          <nav className="grid gap-3 sm:grid-cols-2">
            {subUser || role === "OWNER" || role === "ADMIN" ? (
              <Link href="/dashboard/membros?tab=pessoas" className="block">
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                      <Users className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pessoas</p>
                      <p className="text-muted-foreground text-xs">Membros e permissões</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : null}

            <Link href="/dashboard/reunioes" className="block">
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                    <CalendarDays className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reuniões</p>
                    <p className="text-muted-foreground text-xs">Programação da semana</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/designacoes/reunioes/conteudo" className="block">
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                    <CalendarDays className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Conteúdo das reuniões</p>
                    <p className="text-muted-foreground text-xs">Apostilas importadas dos .jwpub</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/configuracoes" className="block">
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                    <Settings className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Configurações</p>
                    <p className="text-muted-foreground text-xs">Reuniões e eventos especiais</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {subUser || role === "OWNER" || role === "ADMIN" ? (
              <Link href="/dashboard/membros?tab=convites" className="block">
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                      <KeyRound className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Convites</p>
                      <p className="text-muted-foreground text-xs">Convites para a congregação</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : null}
          </nav>
        </section>
      )}

      {membership && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" aria-hidden="true" />
              {membership.organization.name}
            </CardTitle>
            <CardDescription>
              {membership.organization._count.members} membro(s) ·{" "}
              {membership.organization._count.persons} pessoa(s) ·{" "}
              {membership.organization._count.families} família(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Badge>{role ? ROLE_LABEL[role] : role}</Badge>
            {linkedPerson ? (
              <Badge variant="outline">Pessoa vinculada ativa</Badge>
            ) : (
              <Badge variant="outline">Sem pessoa vinculada</Badge>
            )}
            <ButtonGhostProfile />
          </CardContent>
        </Card>
      )}

      {subUser && organizations && organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organizações</CardTitle>
            <CardDescription>Você tem acesso total ao sistema (sub-user).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {organizations.map((organization) => (
              <div
                key={organization.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <p className="truncate text-sm font-medium">{organization.name}</p>
                <Badge variant="outline">{organization._count.persons} pessoa(s)</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function ButtonGhostProfile() {
  return (
    <Link
      href="/dashboard/perfil"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors"
    >
      <UserRound className="size-3.5" aria-hidden="true" />
      Ver perfil
    </Link>
  );
}
