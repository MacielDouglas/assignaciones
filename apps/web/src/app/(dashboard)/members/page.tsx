import { memberRoleLabels } from "@asignaciones/shared";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LinkPersonForm,
  MemberRoleSelect,
  UnlinkPersonButton,
} from "@/features/organizations/components/member-forms";
import { InviteForm } from "@/features/organizations/components/token-forms";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { getOrgContext } from "@/features/organizations/server/context";
import { OrgError } from "@/features/organizations/server/errors";
import { listMembers } from "@/features/organizations/server/members";
import { listPeople } from "@/features/organizations/server/people";

export const metadata: Metadata = {
  title: "Membros",
  description: "Membros da organização",
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const actor = await getActorFromHeaders(await headers());
  if (!actor) {
    return null;
  }

  const { org } = await searchParams;
  let ctx: Awaited<ReturnType<typeof getOrgContext>>;
  try {
    ctx = await getOrgContext(actor, org);
  } catch (error) {
    if (error instanceof OrgError) {
      redirect("/dashboard");
    }
    throw error;
  }

  if (!ctx.canManagePeople) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-xl font-semibold sm:text-2xl">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          Apenas owners e admins podem gerenciar membros.
        </p>
      </div>
    );
  }

  const [members, people] = await Promise.all([
    listMembers(actor, ctx.organization.id),
    listPeople(actor, ctx.organization.id),
  ]);

  const unlinkedPeople = people.filter((person) => !person.member);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-xl font-semibold sm:text-2xl">Membros</h1>
          <Badge variant="secondary">{ctx.organization.name}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie os usuários da organização, papéis e vínculos com pessoas.
        </p>
      </section>

      {ctx.canInvite ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Convidar usuário</CardTitle>
            <CardDescription>
              Gere um token único para convidar uma pessoa para a organização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm organizationId={ctx.organization.id} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usuários</CardTitle>
          <CardDescription>Membros pendentes ainda não possuem pessoa vinculada.</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum membro ainda.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage
                        src={member.user.image ?? undefined}
                        alt={member.user.name ?? "Usuário"}
                      />
                      <AvatarFallback>
                        {member.user.name?.slice(0, 2).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {member.user.name ?? "Sem nome"}
                        </span>
                        {!member.personId ? (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            Pendente
                          </Badge>
                        ) : null}
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {member.user.email ?? "Sem e-mail"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:w-44">
                    {member.person ? (
                      <span className="truncate">Pessoa: {member.person.name}</span>
                    ) : (
                      <span>Sem pessoa vinculada</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {member.personId && ctx.canManagePeople ? (
                      <UnlinkPersonButton memberId={member.id} />
                    ) : null}
                    {!member.personId && ctx.canManagePeople ? (
                      <LinkPersonForm
                        memberId={member.id}
                        people={unlinkedPeople}
                      />
                    ) : null}
                    {ctx.canManageRoles ? (
                      <MemberRoleSelect
                        memberId={member.id}
                        role={member.role}
                        disabled={member.user.id === actor.userId}
                      />
                    ) : (
                      <Badge variant="outline">{memberRoleLabels[member.role]}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
