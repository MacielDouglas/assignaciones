"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Sector = { id: string; name: string; task: string };

export function SectorListCard<T extends Sector>({
  title,
  description,
  addLabel,
  sectors,
  canEdit,
  deletingId,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  description: string;
  addLabel: string;
  sectors: T[];
  canEdit: boolean;
  deletingId: string | null;
  onAdd: () => void;
  onEdit: (sector: T) => void;
  onDelete: (sector: T) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={onAdd} className="shrink-0">
              <Plus /> {addLabel}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sectors.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Nenhum setor configurado.
          </p>
        ) : (
          sectors.map((sector) => (
            <div
              key={sector.id}
              className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">{sector.name}</p>
                <p className="text-muted-foreground text-sm">{sector.task}</p>
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar setor ${sector.name}`}
                    onClick={() => onEdit(sector)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir setor ${sector.name}`}
                    disabled={deletingId === sector.id}
                    onClick={() => onDelete(sector)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
