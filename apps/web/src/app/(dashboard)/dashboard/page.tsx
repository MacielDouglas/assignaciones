import { memberRoleLabels } from "@asignaciones/shared";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Onboarding } from "@/features/organizations/components/onboarding";
import { GenerateOrgTokenForm } from "@/features/organizations/components/token-forms";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { getCurrentContext } from "@/features/organizations/server/context";

export const metadata: Metadata = {
  title: "Painel",
  description: "Painel do Asignaciones",
};

function StatsCards() {
  const stats = [
    { title: "Atribuições", description: "Suas tarefas e responsabilidades" },
    { title: "Pendentes", description: "Tarefas aguardando execução" },
    { title: "Concluídas", description: "Atribuições finalizadas" },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader>
            <CardTitle className="text-lg">{stat.title}</CardTitle>
            <CardDescription>{stat.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

export default async function DashboardPage() {
  const actor = await getActorFromHeaders(await headers());
  if (!actor) {
    return null;
  }

  const context = await getCurrentContext(actor);

  if (actor.isSubUser) {
    const organizations = context.kind === "sub-user" ? context.organizations : [];

    return (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-semibold sm:text-2xl">Painel do sub-user</h1>
            <Badge className="w-fit">Sub-user</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Você tem acesso total. Gere tokens para a criação de novas organizações e acompanhe
            todas as organizações do sistema.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Token para criar organização</CardTitle>
            <CardDescription>
              Quem usar este token pode criar uma nova organização e se torna o owner dela.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GenerateOrgTokenForm />
          </CardContent>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-base font-semibold">Organizações</h2>
          {organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma organização criada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {organizations.map((org) => (
                <Card key={org.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{org.name}</CardTitle>
                    <CardDescription>
                      {org.memberCount} membro(s) · {org.personCount} pessoa(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                    >
                      <Link href={`/members?org=${org.id}`}>Membros</Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                    >
                      <Link href={`/people?org=${org.id}`}>Pessoas</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (context.kind !== "member") {
    return <Onboarding />;
  }

  const { membership } = context;

  if (!membership.person) {
    return (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h1 className="font-heading text-xl font-semibold sm:text-2xl">
            Você entrou em {membership.organization.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Você ainda não tem uma pessoa vinculada nesta organização.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aguardando vínculo</CardTitle>
            <CardDescription>
              Um owner ou admin da organização precisa criar uma pessoa e vinculá-la ao seu usuário
              para que você tenha acesso aos dados.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const role = membership.role;
  const canManagePeople = role === "OWNER" || role === "ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback>{actor.name?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-xl font-semibold sm:text-2xl">
              Olá, {actor.name?.split(" ")[0] ?? "usuário"}!
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{membership.organization.name}</Badge>
              <Badge variant="outline">{memberRoleLabels[role]}</Badge>
            </div>
          </div>
        </div>
      </section>

      {canManagePeople ? (
        <section className="flex flex-wrap gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <Link href="/members">Membros</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <Link href="/people">Pessoas</Link>
          </Button>
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sua pessoa</CardTitle>
          <CardDescription>Pessoa vinculada ao seu usuário nesta organização</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback>{membership.person.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{membership.person.name}</p>
            <p className="text-sm text-muted-foreground">{memberRoleLabels[role]}</p>
          </div>
        </CardContent>
      </Card>

      <StatsCards />
    </div>
  );
}
