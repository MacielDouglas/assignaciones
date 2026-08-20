"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import type { WeekDay } from "@/generated/prisma/enums";
import { DayPicker } from "./day-picker";

export function ScheduleMeetingDialog({
  title,
  description,
  day,
  time,
  saving,
  onSave,
  onClose,
}: {
  title: string;
  description: string;
  day: WeekDay | null;
  time: string | null;
  saving: boolean;
  onSave: (day: WeekDay, time: string) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState<WeekDay>(day ?? "MONDAY");
  const [selectedTime, setSelectedTime] = useState(time ?? "18:00");

  async function handleSave() {
    await onSave(selectedDay, selectedTime);
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
          <DialogTitle>Configurar {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Dia da semana</Label>
            <DayPicker value={selectedDay} onChange={setSelectedDay} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-time">Horário</Label>
            <Input
              id="meeting-time"
              type="time"
              value={selectedTime}
              onChange={(event) => setSelectedTime(event.target.value)}
              disabled={saving}
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
