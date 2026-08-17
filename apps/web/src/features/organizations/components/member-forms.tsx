"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  type ActionState,
  linkPersonToMemberAction,
  unlinkPersonFromMemberAction,
  updateMemberRoleAction,
} from "@/features/organizations/server/actions";

type MemberState = ActionState<{ memberId: string }>;
const initialState: MemberState = { ok: false, error: "" };

export function MemberRoleSelect({
  memberId,
  role,
  disabled,
}: {
  memberId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<MemberState, FormData>(
    updateMemberRoleAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-1"
    >
      <input
        type="hidden"
        name="memberId"
        value={memberId}
      />
      <select
        name="role"
        defaultValue={role}
        disabled={disabled || pending}
        onChange={(event) => {
          if (event.target.value !== role) {
            event.target.form?.requestSubmit();
          }
        }}
        className="h-8 w-fit min-w-28 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="OWNER">Owner</option>
        <option value="ADMIN">Admin</option>
        <option value="MEMBER">Member</option>
      </select>
      {!state.ok && state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}

export function LinkPersonForm({
  memberId,
  people,
}: {
  memberId: string;
  people: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<MemberState, FormData>(
    linkPersonToMemberAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  if (people.length === 0) {
    return <p className="text-xs text-muted-foreground">Crie uma pessoa primeiro para vincular.</p>;
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-1.5"
    >
      <input
        type="hidden"
        name="memberId"
        value={memberId}
      />
      <select
        name="personId"
        defaultValue=""
        required
        disabled={pending}
        className="h-8 w-full min-w-40 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <option
          value=""
          disabled
        >
          Selecionar pessoa...
        </option>
        {people.map((person) => (
          <option
            key={person.id}
            value={person.id}
          >
            {person.name}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={pending}
      >
        {pending ? "Vinculando..." : "Vincular pessoa"}
      </Button>
      {!state.ok && state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}

export function UnlinkPersonButton({ memberId }: { memberId: string }) {
  const [state, formAction, pending] = useActionState<MemberState, FormData>(
    unlinkPersonFromMemberAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-1"
    >
      <input
        type="hidden"
        name="memberId"
        value={memberId}
      />
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={pending}
      >
        {pending ? "Desvinculando..." : "Desvincular"}
      </Button>
      {!state.ok && state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}
