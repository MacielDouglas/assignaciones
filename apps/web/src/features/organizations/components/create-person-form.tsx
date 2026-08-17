"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ActionState, createPersonAction } from "@/features/organizations/server/actions";

type PersonState = ActionState<{ personId: string }>;
const initialState: PersonState = { ok: false, error: "" };

export function CreatePersonForm({ organizationId }: { organizationId: string }) {
  const [state, formAction, pending] = useActionState<PersonState, FormData>(
    createPersonAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3"
    >
      <input
        type="hidden"
        name="organizationId"
        value={organizationId}
      />
      <div className="grid gap-1.5">
        <Label htmlFor="person-name">Nome</Label>
        <Input
          id="person-name"
          name="name"
          placeholder="Nome da pessoa"
          maxLength={120}
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="person-email">E-mail (opcional)</Label>
        <Input
          id="person-email"
          name="email"
          type="email"
          placeholder="pessoa@exemplo.com"
          maxLength={254}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="person-phone">Telefone (opcional)</Label>
        <Input
          id="person-phone"
          name="phone"
          placeholder="(11) 99999-9999"
          maxLength={20}
        />
      </div>
      {!state.ok && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button
        type="submit"
        disabled={pending}
      >
        {pending ? "Criando..." : "Criar pessoa"}
      </Button>
    </form>
  );
}
