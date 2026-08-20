"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WEEKDAY_FULL_LABELS } from "@/features/settings/lib/types";
import type { WeekDay } from "@/generated/prisma/enums";

export function RegularMeetingCard({
  title,
  day,
  time,
  canEdit,
  deleting,
  onConfigure,
  onDelete,
}: {
  title: string;
  day: WeekDay | null;
  time: string | null;
  canEdit: boolean;
  deleting: boolean;
  onConfigure: () => void;
  onDelete: () => void;
}) {
  const configured = day !== null && time !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {configured ? "Dia e horário configurados" : "A reunião ainda não foi configurada"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        {configured ? (
          <>
            <p className="text-sm font-medium">
              {WEEKDAY_FULL_LABELS[day]} · {time}
            </p>
            {canEdit && (
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar ${title}`}
                  onClick={onConfigure}
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir ${title}`}
                  disabled={deleting}
                  onClick={onDelete}
                >
                  <Trash2 />
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">Reunião não configurada.</p>
            {canEdit && (
              <Button type="button" variant="outline" size="sm" onClick={onConfigure}>
                <Plus /> Configurar
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
