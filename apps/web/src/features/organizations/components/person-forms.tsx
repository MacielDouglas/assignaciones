"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  type ActionState,
  deletePersonAction,
  updatePersonAction,
} from "@/features/organizations/server/actions";

type PersonState = ActionState<{ personId: string }>;
const initialState: PersonState = { ok: false, error: "" };

export function EditPersonSheet({
  organizationId,
  person,
}: {
  organizationId: string;
  person: { id: string; name: string; email: string | null; phone: string | null };
}) {
  const [state, formAction, pending] = useActionState<PersonState, FormData>(
    updatePersonAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
        >
          Editar
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar pessoa</SheetTitle>
          <SheetDescription>Atualize os dados da pessoa.</SheetDescription>
        </SheetHeader>
        <form
          ref={formRef}
          action={formAction}
          className="flex flex-col gap-3 px-4"
        >
          <input
            type="hidden"
            name="organizationId"
            value={organizationId}
          />
          <input
            type="hidden"
            name="personId"
            value={person.id}
          />
          <div className="grid gap-1.5">
            <Label htmlFor={`person-name-${person.id}`}>Nome</Label>
            <Input
              id={`person-name-${person.id}`}
              name="name"
              defaultValue={person.name}
              placeholder="Nome da pessoa"
              maxLength={120}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`person-email-${person.id}`}>E-mail (opcional)</Label>
            <Input
              id={`person-email-${person.id}`}
              name="email"
              type="email"
              defaultValue={person.email ?? ""}
              placeholder="pessoa@exemplo.com"
              maxLength={254}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`person-phone-${person.id}`}>Telefone (opcional)</Label>
            <Input
              id={`person-phone-${person.id}`}
              name="phone"
              defaultValue={person.phone ?? ""}
              placeholder="(11) 99999-9999"
              maxLength={20}
            />
          </div>
          {!state.ok && state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <SheetFooter>
            <Button
              type="submit"
              disabled={pending}
            >
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function DeletePersonButton({
  organizationId,
  personId,
}: {
  organizationId: string;
  personId: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [state, formAction, pending] = useActionState<PersonState, FormData>(
    deletePersonAction,
    initialState,
  );

  if (!confirm) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirm(true)}
      >
        Excluir
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-1"
    >
      <input
        type="hidden"
        name="organizationId"
        value={organizationId}
      />
      <input
        type="hidden"
        name="personId"
        value={personId}
      />
      <div className="flex items-center gap-1.5">
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={pending}
        >
          {pending ? "Excluindo..." : "Confirmar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setConfirm(false)}
        >
          Cancelar
        </Button>
      </div>
      {!state.ok && state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}

export function PersonAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
    >
      {initials || "?"}
    </span>
  );
}
