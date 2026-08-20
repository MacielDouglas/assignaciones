"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eventImpact, findConflicts } from "@/features/settings/lib/schedule";
import type { ScheduleData, SpecialEventData } from "@/features/settings/lib/types";
import type { SpecialEventKind } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import type { SpecialEventInput } from "../schemas";

type FieldKey =
  | "date"
  | "endDate"
  | "time"
  | "location"
  | "theme"
  | "speaker"
  | "traveler"
  | "serviceTalk"
  | "publicTalk"
  | "finalTalk";

interface FieldDef {
  key: FieldKey;
  label: string;
  type: "date" | "time" | "text";
  required: boolean;
  placeholder?: string;
}

const FIELDS: Record<SpecialEventKind, FieldDef[]> = {
  MEMORIAL: [
    { key: "date", label: "Data", type: "date", required: true },
    { key: "time", label: "Hora", type: "time", required: true },
    {
      key: "location",
      label: "Local",
      type: "text",
      required: false,
      placeholder: "Salão ou local do evento",
    },
  ],
  SPECIAL_TALK: [
    { key: "date", label: "Data", type: "date", required: true },
    {
      key: "theme",
      label: "Tema",
      type: "text",
      required: true,
      placeholder: "Tema do discurso",
    },
    {
      key: "speaker",
      label: "Orador",
      type: "text",
      required: false,
      placeholder: "Nome do orador",
    },
  ],
  CIRCUIT_OVERSEER_VISIT: [
    { key: "date", label: "Data inicial", type: "date", required: true },
    { key: "endDate", label: "Data final", type: "date", required: true },
    {
      key: "traveler",
      label: "Viajante",
      type: "text",
      required: false,
      placeholder: "Nome do superintendente",
    },
    {
      key: "serviceTalk",
      label: "Discurso de serviço",
      type: "text",
      required: false,
      placeholder: "Tema do discurso de serviço",
    },
    {
      key: "publicTalk",
      label: "Discurso público",
      type: "text",
      required: false,
      placeholder: "Tema do discurso público",
    },
    {
      key: "finalTalk",
      label: "Discurso final",
      type: "text",
      required: false,
      placeholder: "Tema do discurso final",
    },
  ],
  CONVENTION: [
    { key: "date", label: "Data inicial", type: "date", required: true },
    { key: "endDate", label: "Data final", type: "date", required: true },
    {
      key: "location",
      label: "Local",
      type: "text",
      required: true,
      placeholder: "Cidade e local do congresso",
    },
  ],
  ASSEMBLY_TRAVELING_OVERSEER: [
    { key: "date", label: "Data", type: "date", required: true },
    {
      key: "location",
      label: "Local",
      type: "text",
      required: true,
      placeholder: "Cidade e local da assembleia",
    },
  ],
  ASSEMBLY_REPRESENTATIVE: [
    { key: "date", label: "Data", type: "date", required: true },
    {
      key: "location",
      label: "Local",
      type: "text",
      required: true,
      placeholder: "Cidade e local da assembleia",
    },
  ],
};

const EMPTY_FIELDS: Record<FieldKey, string> = {
  date: "",
  endDate: "",
  time: "",
  location: "",
  theme: "",
  speaker: "",
  traveler: "",
  serviceTalk: "",
  publicTalk: "",
  finalTalk: "",
};

function toPayload(kind: SpecialEventKind, fields: Record<FieldKey, string>): SpecialEventInput {
  switch (kind) {
    case "MEMORIAL":
      return { kind, date: fields.date, time: fields.time, location: fields.location || undefined };
    case "SPECIAL_TALK":
      return {
        kind,
        date: fields.date,
        theme: fields.theme,
        speaker: fields.speaker || undefined,
      };
    case "CIRCUIT_OVERSEER_VISIT":
      return {
        kind,
        date: fields.date,
        endDate: fields.endDate,
        traveler: fields.traveler || undefined,
        serviceTalk: fields.serviceTalk || undefined,
        publicTalk: fields.publicTalk || undefined,
        finalTalk: fields.finalTalk || undefined,
      };
    case "CONVENTION":
      return {
        kind,
        date: fields.date,
        endDate: fields.endDate,
        location: fields.location || undefined,
      };
    case "ASSEMBLY_TRAVELING_OVERSEER":
    case "ASSEMBLY_REPRESENTATIVE":
      return { kind, date: fields.date, location: fields.location || undefined };
  }
}

export function EventForm({
  kind,
  initial,
  schedule,
  events,
  saving,
  onSave,
  onCancel,
}: {
  kind: SpecialEventKind;
  initial: SpecialEventData | null;
  schedule: ScheduleData;
  events: SpecialEventData[];
  saving: boolean;
  onSave: (payload: SpecialEventInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState<Record<FieldKey, string>>(() => {
    if (!initial) return { ...EMPTY_FIELDS };
    return {
      ...EMPTY_FIELDS,
      date: initial.date,
      endDate: initial.endDate ?? "",
      time: initial.time ?? "",
      location: initial.location ?? "",
      theme: initial.theme ?? "",
      speaker: initial.speaker ?? "",
      traveler: initial.traveler ?? "",
      serviceTalk: initial.serviceTalk ?? "",
      publicTalk: initial.publicTalk ?? "",
      finalTalk: initial.finalTalk ?? "",
    };
  });
  const [clientError, setClientError] = useState<string | null>(null);

  const rangeKind = kind === "CIRCUIT_OVERSEER_VISIT" || kind === "CONVENTION";
  const validRange = !rangeKind || fields.endDate === "" || fields.endDate >= fields.date;

  const preview: SpecialEventData | null = useMemo(() => {
    if (fields.date === "" || !validRange) return null;
    return {
      id: "__draft__",
      kind,
      date: fields.date,
      endDate: rangeKind && fields.endDate !== "" ? fields.endDate : null,
      time: fields.time || null,
      location: fields.location || null,
      theme: fields.theme || null,
      speaker: fields.speaker || null,
      traveler: fields.traveler || null,
      serviceTalk: fields.serviceTalk || null,
      publicTalk: fields.publicTalk || null,
      finalTalk: fields.finalTalk || null,
      createdAt: "",
      updatedAt: "",
    };
  }, [fields, kind, rangeKind, validRange]);

  const impact = preview ? eventImpact(preview, schedule) : null;

  const previewConflicts = useMemo(() => {
    if (!preview) return [];
    return findConflicts([...events, preview]).filter(
      (conflict) => conflict.eventId === "__draft__",
    );
  }, [preview, events]);

  function set(key: FieldKey, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setClientError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    for (const field of FIELDS[kind]) {
      if (field.required && fields[field.key].trim() === "") {
        setClientError(`Informe ${field.label.toLowerCase()}.`);
        return;
      }
    }
    if (rangeKind && fields.endDate < fields.date) {
      setClientError("A data final deve ser igual ou posterior à data inicial.");
      return;
    }
    setClientError(null);
    onSave(toPayload(kind, fields));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS[kind].map((field) => (
          <div
            key={field.key}
            className={cn("space-y-2", field.type === "text" && "sm:col-span-2")}
          >
            <Label htmlFor={`event-${field.key}`}>{field.label}</Label>
            <Input
              id={`event-${field.key}`}
              type={field.type}
              required={field.required}
              value={fields[field.key]}
              onChange={(event) => set(field.key, event.target.value)}
              placeholder={field.placeholder}
              disabled={saving}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {!validRange && fields.endDate !== "" && fields.date !== "" && (
        <p className="text-destructive text-sm">
          A data final deve ser igual ou posterior à data inicial.
        </p>
      )}

      {impact && (
        <div className="rounded-2xl border bg-muted/40 p-3.5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Como afeta a agenda
          </p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {impact.midweek.kind !== "normal" && <li>{impact.midweek.detail}</li>}
            {impact.weekend.kind !== "normal" && <li>{impact.weekend.detail}</li>}
          </ul>
        </div>
      )}

      {previewConflicts.length > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5">
          <p className="text-destructive text-xs font-medium uppercase tracking-wide">
            Conflitos de agenda
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-destructive">
            {previewConflicts.map((conflict, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lista estática de mensagens no formulário
              <li key={index}>{conflict.message}</li>
            ))}
          </ul>
        </div>
      )}

      {clientError && <p className="text-destructive text-sm">{clientError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : initial ? "Salvar alterações" : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
