"use client";

import { AlertTriangle } from "lucide-react";
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
import type { GeneralCleaningData } from "@/features/settings/lib/types";
import type { CleaningGeneralInput } from "../schemas";

export function GeneralCleaningDialog({
  cleaning,
  weeklyEnabled,
  saving,
  onSave,
  onClose,
}: {
  cleaning: GeneralCleaningData | null;
  weeklyEnabled: boolean;
  saving: boolean;
  onSave: (payload: CleaningGeneralInput) => Promise<void>;
  onClose: () => void;
}) {
  const [date, setDate] = useState(cleaning?.date ?? "");
  const [time, setTime] = useState(cleaning?.time ?? "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (date === "") {
      setClientError("Informe a data da Limpeza Geral.");
      return;
    }
    if (time === "") {
      setClientError("Informe o horário da Limpeza Geral.");
      return;
    }
    if (weeklyEnabled && !acknowledged) {
      setClientError("Confirme o conflito com a Limpeza Semanal para salvar.");
      return;
    }
    setClientError(null);
    onSave({ date, time, acknowledgedConflict: acknowledged });
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
          <DialogTitle>{cleaning ? "Editar Limpeza Geral" : "Adicionar Limpeza Geral"}</DialogTitle>
          <DialogDescription>Agende uma limpeza mais completa da congregação.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="general-date">Data</Label>
              <Input
                id="general-date"
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setClientError(null);
                }}
                disabled={saving}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="general-time">Horário</Label>
              <Input
                id="general-time"
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
          </div>

          {weeklyEnabled && (
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
