"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { formatDay, parseIsoDay } from "@/features/settings/lib/schedule";
import type { GeneralCleaningData, WeeklyCleaningData } from "@/features/settings/lib/types";
import type { CleaningGeneralInput, CleaningGeneralUpdateInput } from "../schemas";
import { CleaningDatePicker } from "./cleaning-date-picker";

export function GeneralCleaningDialog({
  cleaning,
  weekly,
  scheduled,
  saving,
  onSave,
  onClose,
}: {
  cleaning: GeneralCleaningData | null;
  weekly: WeeklyCleaningData;
  scheduled: string[];
  saving: boolean;
  onSave: (payload: CleaningGeneralInput | CleaningGeneralUpdateInput) => Promise<void>;
  onClose: () => void;
}) {
  const editing = cleaning !== null;
  const [entries, setEntries] = useState<{ date: string; time: string }[]>(
    cleaning ? [{ date: cleaning.date, time: cleaning.time }] : [],
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const weeklyActive = weekly.time !== null && weekly.dates.length > 0;

  function handleSelect(picked: string[]) {
    if (editing) {
      const current = new Set(entries.map((entry) => entry.date));
      const added = picked.find((date) => !current.has(date));
      if (added) {
        setEntries([{ date: added, time: entries[0]?.time ?? "09:00" }]);
      } else {
        setEntries([]);
      }
    } else {
      const existing = new Map(entries.map((entry) => [entry.date, entry.time]));
      setEntries(picked.map((date) => ({ date, time: existing.get(date) ?? "09:00" })));
    }
    setClientError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (entries.length === 0) {
      setClientError("Selecione ao menos uma data no calendário.");
      return;
    }
    if (entries.some((entry) => entry.time === "")) {
      setClientError("Informe o horário de cada data selecionada.");
      return;
    }
    if (weeklyActive && !acknowledged) {
      setClientError("Confirme o conflito com a Limpeza Semanal para salvar.");
      return;
    }
    setClientError(null);
    if (editing) {
      onSave({ date: entries[0].date, time: entries[0].time, acknowledgedConflict: acknowledged });
    } else {
      onSave({ dates: entries, acknowledgedConflict: acknowledged });
    }
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
          <DialogTitle>{editing ? "Editar Limpeza Geral" : "Adicionar Limpeza Geral"}</DialogTitle>
          <DialogDescription>
            Escolha no calendário as datas em que a limpeza ocorrerá. Apenas uma data por mês.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Datas</Label>
            <div className="flex justify-center rounded-lg border">
              <CleaningDatePicker
                mode="general"
                selected={entries.map((entry) => entry.date)}
                scheduled={scheduled}
                onSelect={handleSelect}
              />
            </div>
            {entries.length > 0 && (
              <ul className="space-y-2">
                {entries.map((entry) => (
                  <li
                    key={entry.date}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2"
                  >
                    <Badge variant="secondary" className="shrink-0">
                      {formatDay(parseIsoDay(entry.date))}
                    </Badge>
                    <Input
                      type="time"
                      value={entry.time}
                      onChange={(event) => {
                        setEntries((current) =>
                          current.map((item) =>
                            item.date === entry.date ? { ...item, time: event.target.value } : item,
                          ),
                        );
                        setClientError(null);
                      }}
                      disabled={saving}
                      aria-label={`Horário da limpeza em ${formatDay(parseIsoDay(entry.date))}`}
                      className="h-8 w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover ${formatDay(parseIsoDay(entry.date))}`}
                      disabled={saving || editing}
                      onClick={() => {
                        setEntries((current) => current.filter((item) => item.date !== entry.date));
                        setClientError(null);
                      }}
                      className="ml-auto size-8"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {weeklyActive && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5">
              <p className="flex items-center gap-1.5 text-destructive text-xs font-medium uppercase tracking-wide">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                Conflito com a Limpeza Semanal
              </p>
              <p className="mt-1.5 text-sm">
                A Limpeza Semanal é cancelada na semana desta Limpeza Geral.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Checkbox
                  id="general-acknowledged"
                  checked={acknowledged}
                  onCheckedChange={(checked) => {
                    setAcknowledged(checked === true);
                    setClientError(null);
                  }}
                  disabled={saving}
                />
                <Label htmlFor="general-acknowledged" className="text-sm font-normal">
                  Estou ciente de que a Limpeza Semanal será cancelada nessa semana.
                </Label>
              </div>
            </div>
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
