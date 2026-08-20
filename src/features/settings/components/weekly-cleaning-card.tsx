"use client";

import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CleaningConflict } from "@/features/settings/lib/cleaning";
import { formatDay, parseIsoDay } from "@/features/settings/lib/schedule";
import type { WeeklyCleaningData } from "@/features/settings/lib/types";

export function WeeklyCleaningCard({
  weekly,
  conflicts,
  canEdit,
  deleting,
  onConfigure,
  onDisable,
}: {
  weekly: WeeklyCleaningData;
  conflicts: CleaningConflict[];
  canEdit: boolean;
  deleting: boolean;
  onConfigure: () => void;
  onDisable: () => void;
}) {
  const weeklyConflicts = conflicts.filter((conflict) => conflict.id === "weekly");
  const configured = weekly.time !== null && weekly.dates.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>Limpeza Semanal</CardTitle>
            <CardDescription>
              Programe as datas desejadas no calendário. Um único horário vale para todas.
            </CardDescription>
          </div>
          {canEdit && (
            <div className="flex shrink-0 gap-1">
              {configured && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDisable}
                  disabled={deleting}
                  className="shrink-0"
                >
                  <Trash2 /> Desativar
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onConfigure} className="shrink-0">
                {configured ? <Pencil /> : <Plus />} {configured ? "Editar" : "Configurar"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {configured ? (
          <>
            <p className="text-sm font-medium">
              Ativada · {weekly.dates.length}{" "}
              {weekly.dates.length === 1 ? "data marcada" : "datas marcadas"} · às {weekly.time}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {weekly.dates.map((date) => (
                <Badge key={date} variant="secondary">
                  {formatDay(parseIsoDay(date))}
                </Badge>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Não ativada.</p>
        )}
        {weeklyConflicts.length > 0 && (
          <ul className="space-y-1.5">
            {weeklyConflicts.map((conflict, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: lista estática de conflitos
                key={index}
                className="text-muted-foreground flex items-center gap-1.5 text-xs"
              >
                <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
                {conflict.message}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
