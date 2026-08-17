"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ActionState,
  redeemMemberInviteAction,
  redeemOrganizationCreateAction,
} from "@/features/organizations/server/actions";

type RedeemState = ActionState<{ organizationId: string; role: "OWNER" | "MEMBER" }>;
const initialState: RedeemState = { ok: false, error: "" };

function useRefreshOnSuccess<T>(state: ActionState<T>) {
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state]);
}

function CreateOrgForm() {
  const [state, formAction, pending] = useActionState<RedeemState, FormData>(
    redeemOrganizationCreateAction,
    initialState,
  );
  useRefreshOnSuccess(state);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="create-code">Token (8 caracteres)</Label>
        <Input
          id="create-code"
          name="code"
          placeholder="ABC123XY"
          maxLength={8}
          autoComplete="off"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="create-name">Nome da organização</Label>
        <Input
          id="create-name"
          name="name"
          placeholder="Minha equipe"
          maxLength={80}
          required
        />
      </div>
      {!state.ok && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button
        type="submit"
        disabled={pending}
      >
        {pending ? "Criando..." : "Criar organização"}
      </Button>
    </form>
  );
}

function JoinOrgForm() {
  const [state, formAction, pending] = useActionState<RedeemState, FormData>(
    redeemMemberInviteAction,
    initialState,
  );
  useRefreshOnSuccess(state);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="join-code">Token do convite</Label>
        <Input
          id="join-code"
          name="code"
          placeholder="ABC123XY"
          maxLength={8}
          autoComplete="off"
          required
        />
      </div>
      {!state.ok && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button
        type="submit"
        disabled={pending}
      >
        {pending ? "Entrando..." : "Entrar na organização"}
      </Button>
    </form>
  );
}

export function Onboarding() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h1 className="font-heading text-xl font-semibold sm:text-2xl">
          Bem-vindo ao Asignaciones!
        </h1>
        <p className="text-sm text-muted-foreground">
          Você ainda não faz parte de nenhuma organização. Crie a sua ou entre com um convite.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-base font-semibold">Criar uma organização</h2>
            <p className="text-sm text-muted-foreground">
              Use o token fornecido pelo sub-user para criar uma nova organização.
            </p>
          </div>
          <CreateOrgForm />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-base font-semibold">Entrar em uma organização</h2>
            <p className="text-sm text-muted-foreground">
              Use o token de convite enviado pelo owner da organização.
            </p>
          </div>
          <JoinOrgForm />
        </div>
      </section>
    </div>
  );
}
