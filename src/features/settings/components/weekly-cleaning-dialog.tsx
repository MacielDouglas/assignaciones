"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { formatDay, parseIsoDay } from "@/features/settings/lib/schedule";
import type { WeeklyCleaningData } from "@/features/settings/lib/types";
import type { CleaningWeeklyInput } from "../schemas";
import { CleaningDatePicker } from "./cleaning-date-picker";

export function WeeklyCleaningDialog({
  weekly,
  scheduled,
  saving,
  onSave,
  onClose,
}: {
  weekly: WeeklyCleaningData;
  scheduled: string[];
  saving: boolean;
  onSave: (payload: CleaningWeeklyInput) => Promise<void>;
  onClose: () => void;
}) {
  const [dates, setDates] = useState<string[]>(weekly.dates);
  const [time, setTime] = useState(weekly.time ?? "09:00");
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (dates.length === 0) {
      setClientError("Selecione ao menos uma data no calendário.");
      return;
    }
    if (time === "") {
      setClientError("Informe o horário da Limpeza Semanal.");
      return;
    }
    setClientError(null);
    onSave({ time, dates });
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
          <DialogDescription>
            Escolha no calendário as datas em que a limpeza ocorrerá. Apenas um dia por semana.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Datas</Label>
            <div className="flex justify-center rounded-lg border">
              <CleaningDatePicker
                mode="weekly"
                selected={dates}
                scheduled={scheduled}
                onSelect={(picked) => {
                  setDates(picked);
                  setClientError(null);
                }}
              />
            </div>
            {dates.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dates.map((date) => (
                  <Badge key={date} variant="secondary" className="gap-1">
                    {formatDay(parseIsoDay(date))}
                    <button
                      type="button"
                      aria-label={`Remover ${formatDay(parseIsoDay(date))}`}
                      disabled={saving}
                      onClick={() => {
                        setDates((current) => current.filter((item) => item !== date));
                        setClientError(null);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
              disabled={saving}
              className="w-full"
            />
          </div>

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
