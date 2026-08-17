import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteTokenButton } from "@/features/organizations/components/token-forms";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { listCreatedTokens, type TokenListEntry } from "@/features/organizations/server/tokens";

export const metadata: Metadata = {
  title: "Tokens",
  description: "Tokens gerados pelo sub-user",
};

const typeLabels: Record<TokenListEntry["type"], string> = {
  ORGANIZATION_CREATE: "Criar organização",
  MEMBER_INVITE: "Convite de membro",
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function TokenStatusBadge({ token }: { token: TokenListEntry }) {
  if (token.usedAt) {
    return <Badge className="w-fit bg-emerald-600 text-white">Usado</Badge>;
  }
  if (token.expiresAt < new Date()) {
    return (
      <Badge
        variant="outline"
        className="w-fit text-muted-foreground"
      >
        Expirado
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="w-fit"
    >
      Disponível
    </Badge>
  );
}

function TokenRow({ token }: { token: TokenListEntry }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{typeLabels[token.type]}</span>
          <TokenStatusBadge token={token} />
        </div>
        <span className="text-xs text-muted-foreground">
          Criado em {formatDateTime(token.createdAt)} · Expira em {formatDateTime(token.expiresAt)}
        </span>
        {token.usedAt ? (
          <span className="text-xs text-muted-foreground">
            Usado em {formatDateTime(token.usedAt)} por{" "}
            <span className="font-medium text-foreground">{token.usedBy?.name ?? "usuário"}</span>
            {token.usedBy?.email ? ` (${token.usedBy.email})` : ""}
            {token.organization ? (
              <>
                {" "}
                · Organização:{" "}
                <span className="font-medium text-foreground">{token.organization.name}</span>
              </>
            ) : null}
          </span>
        ) : null}
      </div>

      {!token.usedAt ? <DeleteTokenButton tokenId={token.id} /> : null}
    </div>
  );
}

export default async function TokensPage() {
  const actor = await getActorFromHeaders(await headers());
  if (!actor) {
    return null;
  }
  if (!actor.isSubUser) {
    redirect("/dashboard");
  }

  const tokens = await listCreatedTokens(actor);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-xl font-semibold sm:text-2xl">Tokens gerados</h1>
          <Badge variant="secondary">Sub-user</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Acompanhe os tokens que você gerou, quem os utilizou e apague os que não foram usados.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico</CardTitle>
          <CardDescription>
            Tokens usados ficam registrados com o usuário e a organização relacionados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum token gerado ainda.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {tokens.map((token) => (
                <TokenRow
                  key={token.id}
                  token={token}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
