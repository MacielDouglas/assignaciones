"use client";

import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CleaningConflict } from "@/features/settings/lib/cleaning";
import { formatDay } from "@/features/settings/lib/schedule";
import type { GeneralCleaningData } from "@/features/settings/lib/types";

export function GeneralCleaningCard({
  cleaning,
  conflicts,
  canEdit,
  deletingId,
  onAdd,
  onEdit,
  onDelete,
}: {
  cleaning: GeneralCleaningData[];
  conflicts: CleaningConflict[];
  canEdit: boolean;
  deletingId: string | null;
  onAdd: () => void;
  onEdit: (cleaning: GeneralCleaningData) => void;
  onDelete: (cleaning: GeneralCleaningData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>Limpeza Geral</CardTitle>
            <CardDescription>
              Limpeza mais completa, conforme a necessidade. Pode ser agendada várias vezes no ano.
            </CardDescription>
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={onAdd} className="shrink-0">
              <Plus /> Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {cleaning.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Nenhuma limpeza geral configurada.
          </p>
        ) : (
          cleaning.map((item) => {
            const itemConflicts = conflicts.filter((conflict) => conflict.id === item.id);
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">
                    {formatDay(new Date(`${item.date}T00:00:00.000Z`))} · {item.time}
                  </p>
                  {itemConflicts.map((conflict, index) => (
                    <p
                      // biome-ignore lint/suspicious/noArrayIndexKey: lista estática de conflitos
                      key={index}
                      className="text-muted-foreground flex items-center gap-1.5 text-xs"
                    >
                      <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
                      {conflict.message}
                    </p>
                  ))}
                </div>
                {canEdit && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar Limpeza Geral de ${item.date}`}
                      onClick={() => onEdit(item)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir Limpeza Geral de ${item.date}`}
                      disabled={deletingId === item.id}
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
