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
import { Textarea } from "@/components/ui/textarea";
import type { CleaningSectorData } from "@/features/settings/lib/types";
import { ALLOWED_SEX_LABELS, ALLOWED_SEX_ORDER } from "@/features/settings/lib/types";
import type { AllowedSex } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import type { CleaningSectorInput } from "../schemas";

export function SectorDialog({
  sector,
  saving,
  onSave,
  onClose,
}: {
  sector: CleaningSectorData | null;
  saving: boolean;
  onSave: (payload: CleaningSectorInput) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(sector?.name ?? "");
  const [task, setTask] = useState(sector?.task ?? "");
  const [peopleNeeded, setPeopleNeeded] = useState(String(sector?.peopleNeeded ?? ""));
  const [allowsYouth, setAllowsYouth] = useState(sector?.allowsYouth ?? true);
  const [allowedSex, setAllowedSex] = useState<AllowedSex>(sector?.allowedSex ?? "BOTH");
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const people = Number(peopleNeeded);
    if (name.trim() === "") {
      setClientError("Informe o nome do setor.");
      return;
    }
    if (task.trim() === "") {
      setClientError("Informe a tarefa do setor.");
      return;
    }
    if (!Number.isInteger(people) || people < 1 || people > 50) {
      setClientError("Informe a quantidade de pessoas (de 1 a 50).");
      return;
    }
    setClientError(null);
    onSave({ name: name.trim(), task: task.trim(), peopleNeeded: people, allowsYouth, allowedSex });
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
          <DialogTitle>{sector ? "Editar setor" : "Adicionar setor"}</DialogTitle>
          <DialogDescription>Configure o setor da Limpeza Após Reunião.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sector-name">Nome do setor</Label>
            <Input
              id="sector-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setClientError(null);
              }}
              placeholder="Ex.: Banheiro Masculino"
              disabled={saving}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector-task">Tarefa</Label>
            <Textarea
              id="sector-task"
              value={task}
              onChange={(event) => {
                setTask(event.target.value);
                setClientError(null);
              }}
              placeholder="Descreva o que deve ser feito neste setor."
              rows={5}
              disabled={saving}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector-people">Quantidade de pessoas</Label>
            <Input
              id="sector-people"
              type="number"
              min={1}
              max={50}
              value={peopleNeeded}
              onChange={(event) => {
                setPeopleNeeded(event.target.value);
                setClientError(null);
              }}
              placeholder="Ex.: 2"
              disabled={saving}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Sexo permitido</Label>
            <div className="flex flex-wrap gap-2">
              {ALLOWED_SEX_ORDER.map((sex) => (
                <Button
                  key={sex}
                  type="button"
                  size="sm"
                  variant={allowedSex === sex ? "default" : "outline"}
                  className={cn(allowedSex !== sex && "text-muted-foreground")}
                  onClick={() => setAllowedSex(sex)}
                  disabled={saving}
                >
                  {ALLOWED_SEX_LABELS[sex]}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="sector-youth"
              checked={allowsYouth}
              onCheckedChange={(checked) => setAllowsYouth(checked === true)}
              disabled={saving}
            />
            <Label htmlFor="sector-youth" className="text-sm font-normal">
              Permite jovens
            </Label>
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
