import { Loader2, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CatalogDraft, CatalogItem } from "./types";

export function CatalogEditor({
  draft,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  draft: CatalogDraft;
  saving: boolean;
  onChange: (draft: CatalogDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const isSongs = draft.kind === "songs";
  const title = isSongs ? "Editar cánticos" : "Editar discursos públicos";
  const unit = isSongs ? "cántico" : "discurso";

  function updateItem(index: number, item: CatalogItem) {
    const next = structuredClone(draft);
    next.items[index] = item;
    onChange(next);
  }

  function removeItem(index: number) {
    const next = structuredClone(draft);
    next.items.splice(index, 1);
    onChange(next);
  }

  function addItem() {
    const next = structuredClone(draft);
    const nextNumber = next.items.reduce((max, item) => Math.max(max, item.number), 0) + 1;
    next.items.push({ number: nextNumber, theme: "" });
    onChange(next);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-dvh max-h-dvh max-w-3xl flex-col gap-0 overflow-hidden rounded-t-none border-x-0 border-b-0 p-0 sm:h-auto sm:max-h-[85vh] sm:rounded-2xl sm:border-x sm:border-b"
      >
        <header className="flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              {title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground truncate text-sm">
              {draft.name} · {draft.symbol}
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={saving}
            aria-label="Fechar"
          >
            <X />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="space-y-9">
            <section className="space-y-4">
              <h3 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Lista · {draft.items.length} {draft.items.length === 1 ? unit : `${unit}s`}
              </h3>
              <div className="space-y-3">
                {draft.items.map((item, index) => (
                  <div
                    key={`${item.number}-${index}`}
                    className="flex items-center gap-2.5 rounded-xl border p-3 sm:gap-3 sm:p-3.5"
                  >
                    <Input
                      className="w-20 shrink-0 tabular-nums"
                      inputMode="numeric"
                      value={item.number || ""}
                      onChange={(event) =>
                        updateItem(index, {
                          ...item,
                          number: Number(event.target.value.replace(/\D/g, "")),
                        })
                      }
                      aria-label="Número"
                    />
                    <Input
                      className="min-w-0 flex-1"
                      value={item.theme}
                      onChange={(event) =>
                        updateItem(index, { ...item, theme: event.target.value })
                      }
                      aria-label="Tema"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="text-destructive shrink-0 rounded-full hover:text-destructive"
                      onClick={() => removeItem(index)}
                      aria-label="Remover linha"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="w-full sm:w-auto"
                onClick={addItem}
              >
                <Plus aria-hidden="true" />
                Adicionar {unit}
              </Button>
            </section>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2.5 border-t bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-2 sm:px-6 sm:pb-4">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button className="w-full sm:w-auto" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
            Salvar
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
