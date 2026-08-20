"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeeklyCleaningData } from "@/features/settings/lib/types";
import type { WeekDay } from "@/generated/prisma/enums";
import type { CleaningWeeklyInput } from "../schemas";
import { DayPicker } from "./day-picker";

export function WeeklyCleaningDialog({
  weekly,
  saving,
  onSave,
  onClose,
}: {
  weekly: WeeklyCleaningData;
  saving: boolean;
  onSave: (payload: CleaningWeeklyInput) => Promise<void>;
  onClose: () => void;
}) {
  const [enabled, setEnabled] = useState(weekly.enabled);
  const [day, setDay] = useState<WeekDay>(weekly.day ?? "SATURDAY");
  const [time, setTime] = useState(weekly.time ?? "09:00");
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (enabled && time === "") {
      setClientError("Informe o horário da Limpeza Semanal.");
      return;
    }
    setClientError(null);
    onSave(enabled ? { enabled: true, day, time } : { enabled: false, day: null, time: null });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Limpeza Semanal</DialogTitle>
          <DialogDescription>Configure a limpeza recorrente da semana.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="weekly-enabled"
              checked={enabled}
              onCheckedChange={(checked) => {
                setEnabled(checked === true);
                setClientError(null);
              }}
              disabled={saving}
            />
            <Label htmlFor="weekly-enabled" className="text-sm font-normal">
              Ativada
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Dia da semana</Label>
            <DayPicker value={day} onChange={setDay} disabled={saving || !enabled} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekly-time">Horário</Label>
            <Input
              id="weekly-time"
              type="time"
              value={time}
              onChange={(event) => {
                setTime(event.target.value);
                setClientError(null);
              }}
              disabled={saving || !enabled}
              className="w-full"
            />
          </div>

          {!enabled && (
            <p className="text-muted-foreground text-sm">A Limpeza Semanal ficará desativada.</p>
          )}

          {clientError && <p className="text-destructive text-sm">{clientError}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
