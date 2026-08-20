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
import { Textarea } from "@/components/ui/textarea";
import type { WeeklySectorData } from "@/features/settings/lib/types";
import type { CleaningListSectorInput } from "../schemas";

export function SectorTaskDialog({
  sector,
  title,
  description,
  saving,
  onSave,
  onClose,
}: {
  sector: WeeklySectorData | null;
  title: string;
  description: string;
  saving: boolean;
  onSave: (payload: CleaningListSectorInput) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(sector?.name ?? "");
  const [task, setTask] = useState(sector?.task ?? "");
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim() === "") {
      setClientError("Informe o nome do setor.");
      return;
    }
    if (task.trim() === "") {
      setClientError("Informe a tarefa do setor.");
      return;
    }
    setClientError(null);
    onSave({ name: name.trim(), task: task.trim() });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {title} · {sector ? "Editar setor" : "Adicionar setor"}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-sector-name">Nome do setor</Label>
            <Input
              id="task-sector-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setClientError(null);
              }}
              placeholder="Ex.: Piso"
              disabled={saving}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-sector-task">Tarefa</Label>
            <Textarea
              id="task-sector-task"
              value={task}
              onChange={(event) => {
                setTask(event.target.value);
                setClientError(null);
              }}
              placeholder="Descreva o que deve ser feito neste setor."
              rows={6}
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
