"use client";

import { useActionState, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type ActionState,
  createMemberInviteAction,
  createOrganizationTokenAction,
  deleteTokenAction,
} from "@/features/organizations/server/actions";
import { CopyCode } from "./copy-code";

type GeneratedToken = { code: string; expiresAt: string };
type TokenState = ActionState<GeneratedToken>;
const initialState: TokenState = { ok: false, error: "" };

function formatExpiry(expiresAt: string): string {
  const date = new Date(expiresAt);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function GeneratedTokenCard({ generated }: { generated: GeneratedToken }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-lg font-bold tracking-widest">{generated.code}</span>
        <Badge
          variant="outline"
          className="w-fit text-xs"
        >
          Expira em {formatExpiry(generated.expiresAt)}
        </Badge>
      </div>
      <CopyCode code={generated.code} />
    </div>
  );
}

export function GenerateOrgTokenForm() {
  const [generated, setGenerated] = useState<GeneratedToken | null>(null);

  const [state, formAction, pending] = useActionState<TokenState>(
    async (_prev) => createOrganizationTokenAction(),
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      setGenerated(state.data);
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction}>
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? "Gerando..." : "Gerar token de organização"}
        </Button>
      </form>

      {!state.ok && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      {generated ? <GeneratedTokenCard generated={generated} /> : null}

      <p className="text-xs text-muted-foreground">
        Quem usar este token poderá criar uma nova organização e se tornará o owner dela. Válido por
        24 horas e uso único.
      </p>
    </div>
  );
}

export function DeleteTokenButton({ tokenId }: { tokenId: string }) {
  const [state, formAction, pending] = useActionState<ActionState<{ tokenId: string }>, FormData>(
    deleteTokenAction,
    { ok: false, error: "" },
  );

  return (
    <form action={formAction}>
      <input
        type="hidden"
        name="tokenId"
        value={tokenId}
      />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={pending}
        className="text-destructive hover:text-destructive"
      >
        {pending ? "Apagando..." : "Apagar"}
      </Button>
      {!state.ok && state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}

export function InviteForm({ organizationId }: { organizationId: string }) {
  const [generated, setGenerated] = useState<GeneratedToken | null>(null);

  const [state, formAction, pending] = useActionState<TokenState, FormData>(async (prev) => {
    const form = new FormData();
    form.set("organizationId", organizationId);
    return createMemberInviteAction(prev, form);
  }, initialState);

  useEffect(() => {
    if (state.ok) {
      setGenerated(state.data);
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction}>
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? "Gerando..." : "Gerar token de convite"}
        </Button>
      </form>

      {!state.ok && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      {generated ? <GeneratedTokenCard generated={generated} /> : null}

      <p className="text-xs text-muted-foreground">
        Envie este token para a pessoa. Ela entra como member e pode ser promovida depois. Válido
        por 24 horas e uso único.
      </p>
    </div>
  );
}
