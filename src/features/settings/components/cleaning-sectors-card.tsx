"use client";

import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CleaningSectorData } from "@/features/settings/lib/types";
import { ALLOWED_SEX_LABELS } from "@/features/settings/lib/types";

export function CleaningSectorsCard({
  sectors,
  canEdit,
  deletingId,
  onAdd,
  onEdit,
  onDelete,
}: {
  sectors: CleaningSectorData[];
  canEdit: boolean;
  deletingId: string | null;
  onAdd: () => void;
  onEdit: (sector: CleaningSectorData) => void;
  onDelete: (sector: CleaningSectorData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>Limpeza Após Reunião</CardTitle>
            <CardDescription>
              Gerada automaticamente após cada reunião de meio de semana, fim de semana, comemoração
              e discurso especial, exceto em semanas de congresso ou assembleias.
            </CardDescription>
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={onAdd} className="shrink-0">
              <Plus /> Adicionar setor
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
              <div className="min-w-0 space-y-1.5">
                <p className="text-sm font-medium">{sector.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">
                    <Users className="mr-1 size-3" aria-hidden="true" />
                    {sector.peopleNeeded} {sector.peopleNeeded === 1 ? "pessoa" : "pessoas"}
                  </Badge>
                  <Badge variant="secondary">{ALLOWED_SEX_LABELS[sector.allowedSex]}</Badge>
                  <Badge variant="secondary">
                    {sector.allowsYouth ? "Permite jovens" : "Somente adultos"}
                  </Badge>
                </div>
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
