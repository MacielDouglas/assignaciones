"use client";

import type { Sex } from "@asignaciones/shared";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { PersonFields, type PersonFormValues } from "./person-fields";

type PersonState = ActionState<{ personId: string }>;
const initialState: PersonState = { ok: false, error: "" };

function toFormData(organizationId: string, personId: string, values: PersonFormValues): FormData {
  const formData = new FormData();
  formData.set("organizationId", organizationId);
  formData.set("personId", personId);
  formData.set("name", values.name);
  formData.set("sex", values.sex ?? "");
  if (values.family) {
    formData.set("family", values.family);
  }
  const booleans: [keyof PersonFormValues, boolean][] = [
    ["isHeadOfFamily", values.isHeadOfFamily],
    ["isYoung", values.isYoung],
    ["isStudent", values.isStudent],
    ["isBaptized", values.isBaptized],
    ["isActive", values.isActive],
    ["hasCleaning", values.hasCleaning],
    ["startingConversation", values.startingConversation],
    ["cultivatingInterest", values.cultivatingInterest],
    ["makingDisciples", values.makingDisciples],
    ["explainingBeliefs", values.explainingBeliefs],
    ["hasBestMinistrySpeech", values.hasBestMinistrySpeech],
    ["hasBibleReading", values.hasBibleReading],
    ["hasServicePrivileges", values.hasServicePrivileges],
    ["hasPrayer", values.hasPrayer],
    ["isElder", values.isElder],
    ["hasWhatWouldYouSay", values.hasWhatWouldYouSay],
    ["hasNVMCChairman", values.hasNVMCChairman],
    ["hasTreasuresSpeech", values.hasTreasuresSpeech],
    ["hasSpiritualGems", values.hasSpiritualGems],
    ["hasChristianLifeParts", values.hasChristianLifeParts],
    ["hasCongregationBibleStudy", values.hasCongregationBibleStudy],
    ["isBibleStudyReader", values.isBibleStudyReader],
    ["hasPublicMeetingChairman", values.hasPublicMeetingChairman],
    ["hasPublicTalk", values.hasPublicTalk],
    ["hasWatchtowerStudyConductor", values.hasWatchtowerStudyConductor],
    ["isWatchtowerStudyReader", values.isWatchtowerStudyReader],
  ];
  for (const [key, value] of booleans) {
    formData.set(key, value ? "on" : "off");
  }
  return formData;
}

function fromPerson(person: {
  id: string;
  name: string;
  sex: Sex;
  family: string | null;
  isHeadOfFamily: boolean;
  isYoung: boolean;
  isStudent: boolean;
  isBaptized: boolean;
  isActive: boolean;
  hasCleaning: boolean;
  startingConversation: boolean;
  cultivatingInterest: boolean;
  makingDisciples: boolean;
  explainingBeliefs: boolean;
  hasBestMinistrySpeech: boolean;
  hasBibleReading: boolean;
  hasServicePrivileges: boolean;
  hasPrayer: boolean;
  isElder: boolean;
  hasWhatWouldYouSay: boolean;
  hasNVMCChairman: boolean;
  hasTreasuresSpeech: boolean;
  hasSpiritualGems: boolean;
  hasChristianLifeParts: boolean;
  hasCongregationBibleStudy: boolean;
  isBibleStudyReader: boolean;
  hasPublicMeetingChairman: boolean;
  hasPublicTalk: boolean;
  hasWatchtowerStudyConductor: boolean;
  isWatchtowerStudyReader: boolean;
}): PersonFormValues {
  return {
    name: person.name,
    sex: person.sex,
    family: person.family ?? "",
    isHeadOfFamily: person.isHeadOfFamily,
    isYoung: person.isYoung,
    isStudent: person.isStudent,
    isBaptized: person.isBaptized,
    isActive: person.isActive,
    hasCleaning: person.hasCleaning,
    startingConversation: person.startingConversation,
    cultivatingInterest: person.cultivatingInterest,
    makingDisciples: person.makingDisciples,
    explainingBeliefs: person.explainingBeliefs,
    hasBestMinistrySpeech: person.hasBestMinistrySpeech,
    hasBibleReading: person.hasBibleReading,
    hasServicePrivileges: person.hasServicePrivileges,
    hasPrayer: person.hasPrayer,
    isElder: person.isElder,
    hasWhatWouldYouSay: person.hasWhatWouldYouSay,
    hasNVMCChairman: person.hasNVMCChairman,
    hasTreasuresSpeech: person.hasTreasuresSpeech,
    hasSpiritualGems: person.hasSpiritualGems,
    hasChristianLifeParts: person.hasChristianLifeParts,
    hasCongregationBibleStudy: person.hasCongregationBibleStudy,
    isBibleStudyReader: person.isBibleStudyReader,
    hasPublicMeetingChairman: person.hasPublicMeetingChairman,
    hasPublicTalk: person.hasPublicTalk,
    hasWatchtowerStudyConductor: person.hasWatchtowerStudyConductor,
    isWatchtowerStudyReader: person.isWatchtowerStudyReader,
  };
}

export function EditPersonSheet({
  organizationId,
  person,
}: {
  organizationId: string;
  person: Parameters<typeof fromPerson>[0];
}) {
  const [state, formAction, pending] = useActionState<PersonState, FormData>(
    updatePersonAction,
    initialState,
  );
  const [values, setValues] = useState<PersonFormValues>(() => fromPerson(person));

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
          className="flex flex-col gap-3 px-4"
          onSubmit={(event) => {
            event.preventDefault();
            formAction(toFormData(organizationId, person.id, values));
          }}
        >
          <PersonFields
            values={values}
            onChange={setValues}
          />
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
