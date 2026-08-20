"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ScheduleData, SpecialEventData } from "@/features/settings/lib/types";
import { EVENT_KIND_LABELS } from "@/features/settings/lib/types";
import type { SpecialEventKind } from "@/generated/prisma/enums";
import type { SpecialEventInput } from "../schemas";
import { EventForm } from "./event-form";

export function EventDialog({
  kind,
  initial,
  schedule,
  events,
  saving,
  onSave,
  onClose,
}: {
  kind: SpecialEventKind;
  initial: SpecialEventData | null;
  schedule: ScheduleData;
  events: SpecialEventData[];
  saving: boolean;
  onSave: (payload: SpecialEventInput) => Promise<void>;
  onClose: () => void;
}) {
  const label = EVENT_KIND_LABELS[kind];

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? `Editar ${label}` : `Configurar ${label}`}</DialogTitle>
          <DialogDescription>
            Defina os dados do evento e veja como ele afeta a agenda de reuniões.
          </DialogDescription>
        </DialogHeader>
        <EventForm
          kind={kind}
          initial={initial}
          schedule={schedule}
          events={events}
          saving={saving}
          onSave={onSave}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
