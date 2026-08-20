"use client";

import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findConflicts, formatDay } from "@/features/settings/lib/schedule";
import type {
  CleaningSectorData,
  GeneralCleaningData,
  GeneralSectorData,
  ScheduleData,
  SpecialEventData,
  WeeklyCleaningData,
  WeeklySectorData,
} from "@/features/settings/lib/types";
import { EVENT_KIND_LABELS, EVENT_KIND_ORDER } from "@/features/settings/lib/types";
import type { SpecialEventKind, WeekDay } from "@/generated/prisma/enums";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import type { SpecialEventInput } from "../schemas";
import { CleaningManager } from "./cleaning-manager";
import { EventDialog } from "./event-dialog";
import { EventList } from "./event-list";
import { RegularMeetingCard } from "./regular-meeting-card";
import { ScheduleMeetingDialog } from "./schedule-meeting-dialog";

type Meeting = "midweek" | "weekend";

interface Draft {
  kind: SpecialEventKind;
  event: SpecialEventData | null;
}

const MEETING_TITLES: Record<Meeting, string> = {
  midweek: "Reunião de Meio de Semana",
  weekend: "Reunião de Fim de Semana",
};

export function SettingsManager({
  organizationId,
  initialSchedule,
  initialEvents,
  initialSectors,
  initialWeekly,
  initialWeeklySectors,
  initialGeneral,
  initialGeneralSectors,
  today,
  canEdit,
}: {
  organizationId: string;
  initialSchedule: ScheduleData;
  initialEvents: SpecialEventData[];
  initialSectors: CleaningSectorData[];
  initialWeekly: WeeklyCleaningData;
  initialWeeklySectors: WeeklySectorData[];
  initialGeneral: GeneralCleaningData[];
  initialGeneralSectors: GeneralSectorData[];
  today: string;
  canEdit: boolean;
}) {
  const [schedule, setSchedule] = useState<ScheduleData>(initialSchedule);
  const [events, setEvents] = useState<SpecialEventData[]>(initialEvents);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);

  const conflicts = useMemo(() => findConflicts(events), [events]);
  const errorConflicts = conflicts.filter((conflict) => conflict.level === "error");

  async function handleSaveSchedule(meeting: Meeting, day: WeekDay, time: string) {
    const next = {
      ...schedule,
      ...(meeting === "midweek"
        ? { midweekDay: day, midweekTime: time }
        : { weekendDay: day, weekendTime: time }),
    };
    setSaving(true);
    try {
      const saved = await apiFetch<ScheduleData>(
        `/api/organizations/${organizationId}/settings/schedule`,
        { method: "PUT", body: JSON.stringify(next) },
      );
      setSchedule(saved);
      setEditingMeeting(null);
      toast.success(`${MEETING_TITLES[meeting]} configurada!`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMeeting(meeting: Meeting) {
    if (
      !confirm(
        `Remover a configuração da ${MEETING_TITLES[meeting].toLowerCase()}? A reunião voltará a ficar não configurada.`,
      )
    ) {
      return;
    }
    setDeletingMeeting(meeting);
    try {
      const next = {
        ...schedule,
        ...(meeting === "midweek"
          ? { midweekDay: null, midweekTime: null }
          : { weekendDay: null, weekendTime: null }),
      };
      const saved = await apiFetch<ScheduleData>(
        `/api/organizations/${organizationId}/settings/schedule`,
        { method: "PUT", body: JSON.stringify(next) },
      );
      setSchedule(saved);
      toast.success("Configuração removida.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingMeeting(null);
    }
  }

  async function handleSaveEvent(payload: SpecialEventInput) {
    setSaving(true);
    try {
      const { event } = await apiFetch<{ event: SpecialEventData }>(
        draft?.event
          ? `/api/organizations/${organizationId}/settings/events/${draft.event.id}`
          : `/api/organizations/${organizationId}/settings/events`,
        {
          method: draft?.event ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setEvents((current) =>
        [...current.filter((item) => item.id !== event.id), event].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      );
      setDraft(null);
      toast.success("Evento salvo!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent(event: SpecialEventData) {
    const label = EVENT_KIND_LABELS[event.kind].toLowerCase();
    const day = formatDay(new Date(`${event.date}T00:00:00.000Z`));
    if (!confirm(`Excluir ${label} de ${day}?`)) return;
    setDeletingId(event.id);
    try {
      await apiFetch(`/api/organizations/${organizationId}/settings/events/${event.id}`, {
        method: "DELETE",
      });
      setEvents((current) => current.filter((item) => item.id !== event.id));
      toast.success("Evento excluído.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Tabs defaultValue="meetings">
      <TabsList>
        <TabsTrigger value="meetings">Reuniões</TabsTrigger>
        <TabsTrigger value="cleaning">Limpeza</TabsTrigger>
      </TabsList>

      <TabsContent value="meetings" className="mt-6 space-y-8">
        {errorConflicts.length > 0 && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle
                className="text-destructive mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0 space-y-1">
                <p className="text-destructive text-sm font-medium">Conflitos de agenda</p>
                {errorConflicts.map((conflict, index) => (
                  <p
                    // biome-ignore lint/suspicious/noArrayIndexKey: lista estática de mensagens
                    key={index}
                    className="text-destructive/90 text-xs"
                  >
                    {conflict.message}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Reuniões regulares</h2>
          <RegularMeetingCard
            title={MEETING_TITLES.midweek}
            day={schedule.midweekDay}
            time={schedule.midweekTime}
            canEdit={canEdit}
            deleting={deletingMeeting === "midweek"}
            onConfigure={() => setEditingMeeting("midweek")}
            onDelete={() => handleDeleteMeeting("midweek")}
          />
          <RegularMeetingCard
            title={MEETING_TITLES.weekend}
            day={schedule.weekendDay}
            time={schedule.weekendTime}
            canEdit={canEdit}
            deleting={deletingMeeting === "weekend"}
            onConfigure={() => setEditingMeeting("weekend")}
            onDelete={() => handleDeleteMeeting("weekend")}
          />
          {editingMeeting && (
            <ScheduleMeetingDialog
              title={MEETING_TITLES[editingMeeting]}
              description="Escolha o dia e o horário da reunião"
              day={editingMeeting === "midweek" ? schedule.midweekDay : schedule.weekendDay}
              time={editingMeeting === "midweek" ? schedule.midweekTime : schedule.weekendTime}
              saving={saving}
              onSave={(day, time) => handleSaveSchedule(editingMeeting, day, time)}
              onClose={() => setEditingMeeting(null)}
            />
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Reuniões especiais</h2>
          {EVENT_KIND_ORDER.map((kind) => (
            <EventList
              key={kind}
              kind={kind}
              events={events.filter((event) => event.kind === kind)}
              schedule={schedule}
              conflicts={conflicts}
              canEdit={canEdit}
              deletingId={deletingId}
              onConfigure={() => setDraft({ kind, event: null })}
              onEdit={(event) => setDraft({ kind, event })}
              onDelete={handleDeleteEvent}
            />
          ))}
          {draft && (
            <EventDialog
              kind={draft.kind}
              initial={draft.event}
              schedule={schedule}
              events={events.filter((event) => event.id !== draft.event?.id)}
              saving={saving}
              onSave={handleSaveEvent}
              onClose={() => setDraft(null)}
            />
          )}
        </section>
      </TabsContent>

      <TabsContent value="cleaning" className="mt-6">
        <CleaningManager
          organizationId={organizationId}
          schedule={schedule}
          events={events}
          today={today}
          initialSectors={initialSectors}
          initialWeekly={initialWeekly}
          initialWeeklySectors={initialWeeklySectors}
          initialGeneral={initialGeneral}
          initialGeneralSectors={initialGeneralSectors}
          canEdit={canEdit}
        />
      </TabsContent>
    </Tabs>
  );
}
