"use client";

import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CleaningConflict } from "@/features/settings/lib/cleaning";
import type { WeeklyCleaningData } from "@/features/settings/lib/types";
import { WEEKDAY_FULL_LABELS } from "@/features/settings/lib/types";

export function WeeklyCleaningCard({
  weekly,
  conflicts,
  canEdit,
  onConfigure,
}: {
  weekly: WeeklyCleaningData;
  conflicts: CleaningConflict[];
  canEdit: boolean;
  onConfigure: () => void;
}) {
  const weeklyConflicts = conflicts.filter((conflict) => conflict.id === "weekly");
  const configured = weekly.enabled && weekly.day !== null && weekly.time !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>Limpeza Semanal</CardTitle>
            <CardDescription>Recorrente, sempre no mesmo dia e horário da semana.</CardDescription>
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={onConfigure} className="shrink-0">
              {configured ? <Pencil /> : <Plus />} {configured ? "Editar" : "Configurar"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {weekly.enabled && weekly.day && weekly.time ? (
          <p className="text-sm font-medium">
            Ativada · {WEEKDAY_FULL_LABELS[weekly.day]} às {weekly.time}
          </p>
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
