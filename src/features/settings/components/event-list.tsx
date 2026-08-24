"use client";

import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventConflict } from "@/features/settings/lib/schedule";
import { eventImpact, eventWeeks, formatDay } from "@/features/settings/lib/schedule";
import type { ScheduleData, SpecialEventData } from "@/features/settings/lib/types";
import { EVENT_KIND_EMPTY, EVENT_KIND_LABELS } from "@/features/settings/lib/types";
import type { SpecialEventKind } from "@/generated/prisma/enums";

const KIND_DESCRIPTIONS: Record<SpecialEventKind, string> = {
  MEMORIAL: "Apenas 1 por ano. Substitui a reunião da semana em que ocorre.",
  SPECIAL_TALK: "Substitui o discurso da reunião de fim de semana.",
  CIRCUIT_OVERSEER_VISIT: "Reunião de meio de semana na terça e Sentinela de 30 minutos.",
  CONVENTION: "Apenas 1 por ano. Não há reuniões durante a semana do congresso.",
  ASSEMBLY_TRAVELING_OVERSEER: "Não há reuniões durante a semana da assembleia.",
  ASSEMBLY_REPRESENTATIVE: "Não há reuniões durante a semana da assembleia.",
};

function rangeLabel(event: SpecialEventData): string {
  const start = formatDay(new Date(`${event.date}T00:00:00.000Z`));
  if (event.endDate) {
    const end = formatDay(new Date(`${event.endDate}T00:00:00.000Z`));
    return `${start} a ${end}`;
  }
  return start;
}

function metaLabel(event: SpecialEventData): string {
  switch (event.kind) {
    case "MEMORIAL":
      return [event.time, event.location].filter(Boolean).join(" · ");
    case "SPECIAL_TALK": {
      const parts = [event.theme];
      if (event.speaker) parts.push(`por ${event.speaker}`);
      return parts.filter(Boolean).join(" · ");
    }
    case "CIRCUIT_OVERSEER_VISIT":
      return [event.traveler, event.serviceTalk, event.publicTalk, event.finalTalk]
        .filter(Boolean)
        .join(" · ");
    case "CONVENTION":
    case "ASSEMBLY_TRAVELING_OVERSEER":
    case "ASSEMBLY_REPRESENTATIVE":
      return event.location ?? "";
  }
}

export function EventList({
  kind,
  events,
  schedule,
  conflicts,
  canEdit,
  deletingId,
  onConfigure,
  onEdit,
  onDelete,
}: {
  kind: SpecialEventKind;
  events: SpecialEventData[];
  schedule: ScheduleData;
  conflicts: EventConflict[];
  canEdit: boolean;
  deletingId: string | null;
  onConfigure: () => void;
  onEdit: (event: SpecialEventData) => void;
  onDelete: (event: SpecialEventData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>{EVENT_KIND_LABELS[kind]}</CardTitle>
            <CardDescription>{KIND_DESCRIPTIONS[kind]}</CardDescription>
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={onConfigure} className="shrink-0">
              <Plus /> Configurar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">{EVENT_KIND_EMPTY[kind]}</p>
        ) : (
          events.map((event) => {
            const impact = eventImpact(event, schedule);
            const weeks = eventWeeks(event);
            const eventConflicts = conflicts.filter((conflict) => conflict.eventId === event.id);
            const badges = [
              impact.midweek.kind === "tuesday" && "Meio de semana na terça",
              impact.midweek.kind === "cancelled" && "Sem reunião de meio de semana",
              impact.weekend.kind === "cancelled" && "Sem reunião de fim de semana",
              impact.weekend.kind === "specialTalk" && "Substitui o discurso público",
              impact.weekend.kind === "shortened" && "Sentinela 30 min + discurso final",
              weeks.length > 1 && `${weeks.length} semanas`,
            ].filter(Boolean) as string[];
            const meta = metaLabel(event);

            return (
              <div
                key={event.id}
                className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">{rangeLabel(event)}</p>
                  {meta && <p className="text-muted-foreground text-xs">{meta}</p>}
                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {badges.map((badge) => (
                        <Badge key={badge} variant="secondary">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {eventConflicts.map((conflict, index) => (
                    <p
                      // biome-ignore lint/suspicious/noArrayIndexKey: lista estática de conflitos do evento
                      key={index}
                      className={
                        conflict.level === "error"
                          ? "flex items-center gap-1.5 text-destructive text-xs"
                          : "text-muted-foreground flex items-center gap-1.5 text-xs"
                      }
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
                      aria-label={`Editar ${EVENT_KIND_LABELS[kind]}`}
                      onClick={() => onEdit(event)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${EVENT_KIND_LABELS[kind]}`}
                      disabled={deletingId === event.id}
                      onClick={() => onDelete(event)}
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
