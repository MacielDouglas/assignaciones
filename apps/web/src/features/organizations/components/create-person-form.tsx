"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { type ActionState, createPersonAction } from "@/features/organizations/server/actions";
import { emptyValues, PersonFields, type PersonFormValues } from "./person-fields";

type PersonState = ActionState<{ personId: string }>;
const initialState: PersonState = { ok: false, error: "" };

function toFormData(organizationId: string, values: PersonFormValues): FormData {
  const formData = new FormData();
  formData.set("organizationId", organizationId);
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

export function CreatePersonForm({ organizationId }: { organizationId: string }) {
  const [state, formAction, pending] = useActionState<PersonState, FormData>(
    createPersonAction,
    initialState,
  );
  const [values, setValues] = useState<PersonFormValues>(emptyValues);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        formAction(toFormData(organizationId, values));
      }}
    >
      <PersonFields
        values={values}
        onChange={setValues}
      />
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
