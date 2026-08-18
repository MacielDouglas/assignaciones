import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatePersonForm } from "@/features/organizations/components/create-person-form";
import {
  DeletePersonButton,
  EditPersonSheet,
  PersonAvatar,
} from "@/features/organizations/components/person-forms";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { getOrgContext } from "@/features/organizations/server/context";
import { OrgError } from "@/features/organizations/server/errors";
import { listPeople } from "@/features/organizations/server/people";

export const metadata: Metadata = {
  title: "Pessoas",
  description: "Pessoas da organização",
};

export default async function PeoplePage({
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
          Apenas owners e admins podem gerenciar pessoas.
        </p>
      </div>
    );
  }

  const people = await listPeople(ctx);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-xl font-semibold sm:text-2xl">Pessoas</h1>
          <Badge variant="secondary">{ctx.organization.name}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Pessoas da organização. Uma pessoa pode ter ou não um usuário vinculado.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nova pessoa</CardTitle>
          <CardDescription>Crie uma pessoa para depois vincular a um usuário.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePersonForm organizationId={ctx.organization.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de pessoas</CardTitle>
          <CardDescription>{people.length} pessoa(s) na organização</CardDescription>
        </CardHeader>
        <CardContent>
          {people.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma pessoa criada ainda.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <PersonAvatar name={person.name} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">{person.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[person.email, person.phone].filter(Boolean).join(" · ") || "Sem contato"}
                      </span>
                      {person.member ? (
                        <Badge
                          variant="outline"
                          className="mt-1 w-fit text-xs"
                        >
                          Vinculada a {person.member.user.name ?? "um usuário"}
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="mt-1 w-fit text-xs"
                        >
                          Sem usuário vinculado
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <EditPersonSheet
                      organizationId={ctx.organization.id}
                      person={person}
                    />
                    <DeletePersonButton
                      organizationId={ctx.organization.id}
                      personId={person.id}
                    />
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
