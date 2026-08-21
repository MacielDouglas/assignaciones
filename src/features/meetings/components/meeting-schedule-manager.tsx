"use client";

import { AlertTriangle, BookOpen, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkbookContent } from "@/features/meetings/lib/jwpub";
import {
  addMinutesToTime,
  articleStartDate,
  buildMidweekMeeting,
  buildWeekendMeeting,
  findWorkbookWeek,
  isoDay,
  listWorkbookWeeks,
  parseIsoDay,
  type SchedulePerson,
  type SongItem,
  type TalkItem,
  type WatchtowerArticleItem,
  weekStartUtc,
} from "@/features/meetings/lib/meeting-builder";
import type { ScheduledMeetingData } from "@/features/meetings/lib/scheduled-meetings";
import type { ScheduledMeetingInput } from "@/features/meetings/schemas";
import type { MeetingType } from "@/generated/prisma/enums";
import { MeetingSectionCard } from "./meeting-section-card";
import { WeekPicker } from "./week-picker";

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "Segunda-feira",
  TUESDAY: "Terça-feira",
  WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira",
  FRIDAY: "Sexta-feira",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

interface MeetingSchedule {
  midweekDay: string | null;
  midweekTime: string | null;
  weekendDay: string | null;
  weekendTime: string | null;
}

function meetingSummary(sections: { parts: { time: string | null; duration: number }[] }[]) {
  const allParts = sections.flatMap((section) => section.parts);
  const total = allParts.reduce((sum, part) => sum + part.duration, 0);
  const last = [...allParts].reverse().find((part) => part.time !== null);
  return { total, endTime: last ? addMinutesToTime(last.time ?? "00:00", last.duration) : null };
}

function savedFor(
  saved: ScheduledMeetingData[],
  weekStartIso: string,
  meetingType: MeetingType,
): ScheduledMeetingData | null {
  return (
    saved.find((entry) => entry.weekStart === weekStartIso && entry.meetingType === meetingType) ??
    null
  );
}

export function MeetingScheduleManager({
  organizationId,
  midweekWorkbooks,
  watchtower,
  schedule,
  songs,
  talks,
  people,
  canEdit,
  today,
  saved,
  initialDate,
}: {
  organizationId: string;
  midweekWorkbooks: { symbol: string; content: WorkbookContent }[];
  watchtower: { symbol: string; articles: WatchtowerArticleItem[] } | null;
  schedule: MeetingSchedule;
  songs: SongItem[];
  talks: TalkItem[];
  people: SchedulePerson[];
  canEdit: boolean;
  today: string;
  saved: ScheduledMeetingData[];
  initialDate?: string;
}) {
  const [tab, setTab] = useState<"midweek" | "weekend">("midweek");
  const [selectedDate, setSelectedDate] = useState(initialDate ?? today.slice(0, 10));
  const [middleSong, setMiddleSong] = useState<number | null>(null);
  const [weekendSelections, setWeekendSelections] = useState({
    openingSong: null as number | null,
    middleSong: null as number | null,
    closingSong: null as number | null,
    talk: talks.length > 0 ? talks[0].number : null,
    articleId: null as string | null,
  });
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [savedMeetings, setSavedMeetings] = useState<ScheduledMeetingData[]>(saved);
  const [saving, setSaving] = useState<MeetingType | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const weekStartIso = useMemo(
    () => isoDay(weekStartUtc(parseIsoDay(selectedDate))),
    [selectedDate],
  );

  const availableWeeks = useMemo(
    () => midweekWorkbooks.flatMap((wb) => listWorkbookWeeks(wb.content, wb.symbol)),
    [midweekWorkbooks],
  );

  const midweekMatch = useMemo(() => {
    if (midweekWorkbooks.length === 0) return null;
    for (const wb of midweekWorkbooks) {
      const week = findWorkbookWeek(wb.content, wb.symbol, weekStartIso);
      if (week) return { symbol: wb.symbol, week };
    }
    return null;
  }, [midweekWorkbooks, weekStartIso]);

  const defaultArticleId = useMemo(() => {
    if (!watchtower) return null;
    const matched = watchtower.articles.find((article) => {
      const date = articleStartDate(article.dates, watchtower.symbol);
      return date && isoDay(weekStartUtc(date)) === weekStartIso;
    });
    return matched?.id ?? null;
  }, [watchtower, weekStartIso]);

  useEffect(() => {
    const midweek = savedFor(savedMeetings, weekStartIso, "MIDWEEK");
    const weekend = savedFor(savedMeetings, weekStartIso, "WEEKEND");
    setMiddleSong(midweek?.middleSong ?? null);
    setWeekendSelections({
      openingSong: weekend?.openingSong ?? null,
      middleSong: weekend?.middleSong ?? null,
      closingSong: weekend?.closingSong ?? null,
      talk: weekend?.talkNumber ?? (talks.length > 0 ? talks[0].number : null),
      articleId: weekend?.articleId ?? defaultArticleId,
    });
    setAssignments(
      Object.fromEntries(
        [...(midweek?.assignments ?? []), ...(weekend?.assignments ?? [])].map((assignment) => [
          assignment.partId,
          assignment.personId,
        ]),
      ),
    );
  }, [weekStartIso, savedMeetings, talks, defaultArticleId]);

  const midweekStartTime = schedule.midweekTime ?? "19:30";
  const weekendStartTime = schedule.weekendTime ?? "09:30";

  const midweekSections = useMemo(() => {
    if (!midweekMatch) return null;
    return buildMidweekMeeting({
      week: midweekMatch.week,
      startTime: midweekStartTime,
      songs,
      middleSong,
    });
  }, [midweekMatch, midweekStartTime, songs, middleSong]);

  const weekendSections = useMemo(
    () =>
      buildWeekendMeeting({
        startTime: weekendStartTime,
        songs,
        talks,
        articles: watchtower?.articles ?? [],
        selections: {
          openingSong: weekendSelections.openingSong,
          middleSong: weekendSelections.middleSong,
          closingSong: weekendSelections.closingSong,
          talk: weekendSelections.talk,
          articleId: weekendSelections.articleId ?? defaultArticleId,
        },
      }),
    [weekendStartTime, songs, talks, watchtower, weekendSelections, defaultArticleId],
  );

  const midweekSummary = midweekSections ? meetingSummary(midweekSections) : null;
  const weekendSummary = meetingSummary(weekendSections);

  const slotLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const section of [...(midweekSections ?? []), ...weekendSections]) {
      for (const part of section.parts) {
        for (const slot of part.slots) {
          map[slot.id] = slot.label;
        }
      }
    }
    return map;
  }, [midweekSections, weekendSections]);

  function handleControlChange(partId: string, value: string) {
    if (tab === "midweek") {
      if (partId === "living-middle-song") {
        setMiddleSong(value ? Number(value) : null);
      }
      return;
    }
    const parsed = value ? Number(value) : null;
    if (partId === "weekend-opening-song")
      setWeekendSelections((s) => ({ ...s, openingSong: parsed }));
    if (partId === "weekend-middle-song")
      setWeekendSelections((s) => ({ ...s, middleSong: parsed }));
    if (partId === "weekend-closing-song")
      setWeekendSelections((s) => ({ ...s, closingSong: parsed }));
    if (partId === "weekend-talk") setWeekendSelections((s) => ({ ...s, talk: parsed }));
    if (partId === "weekend-watchtower") setWeekendSelections((s) => ({ ...s, articleId: value }));
  }

  function handleAssign(slotId: string, personId: string) {
    setAssignments((current) => {
      const next = { ...current };
      if (personId === "") delete next[slotId];
      else next[slotId] = personId;
      return next;
    });
  }

  async function handleSave(meetingType: MeetingType) {
    setSaving(meetingType);
    try {
      const payload: ScheduledMeetingInput = {
        weekStart: weekStartIso,
        meetingType,
        middleSong: meetingType === "MIDWEEK" ? middleSong : weekendSelections.middleSong,
        openingSong: meetingType === "WEEKEND" ? weekendSelections.openingSong : null,
        closingSong: meetingType === "WEEKEND" ? weekendSelections.closingSong : null,
        talkNumber: meetingType === "WEEKEND" ? weekendSelections.talk : null,
        articleId: meetingType === "WEEKEND" ? weekendSelections.articleId : null,
        assignments: Object.entries(assignments)
          .filter(([, personId]) => personId !== "")
          .map(([partId, personId]) => ({
            partId,
            label: slotLabels[partId] ?? partId,
            personId,
          })),
      };

      const response = await fetch(`/api/organizations/${organizationId}/meetings/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Erro ao salvar a programação.");
      }

      setSavedMeetings((current) => {
        const next = current.filter(
          (entry) => !(entry.weekStart === weekStartIso && entry.meetingType === meetingType),
        );
        return [...next, data as ScheduledMeetingData];
      });
      toast.success(
        meetingType === "MIDWEEK"
          ? "Programação do meio de semana salva."
          : "Programação do fim de semana salva.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar a programação.");
    } finally {
      setSaving(null);
    }
  }

  async function handleDeleteWeek() {
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/meetings/schedule?weekStart=${weekStartIso}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Erro ao excluir a programação.");
      }

      setSavedMeetings((current) => current.filter((entry) => entry.weekStart !== weekStartIso));
      setMiddleSong(null);
      setWeekendSelections((s) => ({
        ...s,
        middleSong: null,
        openingSong: null,
        closingSong: null,
        talk: talks.length > 0 ? talks[0].number : null,
        articleId: defaultArticleId,
      }));
      setAssignments({});
      setConfirmDeleteOpen(false);
      toast.success("Programação da semana excluída.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir a programação.");
    } finally {
      setDeleting(false);
    }
  }

  const midweekSaved = savedFor(savedMeetings, weekStartIso, "MIDWEEK") !== null;
  const weekendSaved = savedFor(savedMeetings, weekStartIso, "WEEKEND") !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          Meio de semana:{" "}
          {schedule.midweekDay ? WEEKDAY_LABELS[schedule.midweekDay] : "não configurado"}
          {schedule.midweekTime ? ` · ${schedule.midweekTime}` : ""}
        </Badge>
        <Badge variant="secondary">
          Fim de semana:{" "}
          {schedule.weekendDay ? WEEKDAY_LABELS[schedule.weekendDay] : "não configurado"}
          {schedule.weekendTime ? ` · ${schedule.weekendTime}` : ""}
        </Badge>
        {(midweekSaved || weekendSaved) && (
          <Badge variant="outline">Programação salva nesta semana</Badge>
        )}
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={!midweekSaved && !weekendSaved}
          >
            <Trash2 aria-hidden="true" />
            Excluir semana
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as "midweek" | "weekend")}>
        <TabsList>
          <TabsTrigger value="midweek">Meio de Semana</TabsTrigger>
          <TabsTrigger value="weekend">Fim de Semana</TabsTrigger>
        </TabsList>

        <div className="py-4">
          <WeekPicker
            weekStartIso={weekStartIso}
            onChange={setSelectedDate}
            weeks={availableWeeks}
          />
        </div>

        <TabsContent value="midweek" className="space-y-4">
          {midweekWorkbooks.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
                  <BookOpen className="size-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Nenhuma apostila importada</p>
                  <p className="text-muted-foreground text-xs">
                    Importe a apostila Vida e Ministério em Conteúdo das reuniões para gerar a
                    programação.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/designacoes/reunioes/conteudo">Conteúdo das reuniões</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {midweekWorkbooks.length > 0 && !midweekMatch && (
            <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
              <AlertTriangle className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
              <p className="text-muted-foreground">
                Nenhuma semana encontrada na apostila para a semana selecionada. Use o seletor
                &quot;Semana da apostila&quot; acima.
              </p>
            </div>
          )}

          {!schedule.midweekTime && (
            <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
              <AlertTriangle className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
              <p className="text-muted-foreground">
                O horário da reunião de meio de semana não está configurado. Use o horário
                provisório das {midweekStartTime}.
              </p>
            </div>
          )}

          {midweekSections && midweekSummary && (
            <>
              {midweekSections.map((section) => (
                <MeetingSectionCard
                  key={section.id}
                  section={section}
                  people={people}
                  assignments={assignments}
                  disabled={!canEdit}
                  onAssign={handleAssign}
                  onControlChange={handleControlChange}
                />
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">
                  Duração total:{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {midweekSummary.total} min
                  </span>{" "}
                  · término às{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {midweekSummary.endTime}
                  </span>
                </p>
                {canEdit && (
                  <Button
                    type="button"
                    onClick={() => handleSave("MIDWEEK")}
                    disabled={saving !== null}
                  >
                    <Save aria-hidden="true" />
                    {saving === "MIDWEEK" ? "Salvando..." : "Salvar"}
                  </Button>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="weekend" className="space-y-4">
          {!schedule.weekendTime && (
            <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
              <AlertTriangle className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
              <p className="text-muted-foreground">
                O horário da reunião de fim de semana não está configurado. Use o horário provisório
                das {weekendStartTime}.
              </p>
            </div>
          )}

          {weekendSections.map((section) => (
            <MeetingSectionCard
              key={section.id}
              section={section}
              people={people}
              assignments={assignments}
              disabled={!canEdit}
              onAssign={handleAssign}
              onControlChange={handleControlChange}
            />
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              Duração total:{" "}
              <span className="text-foreground font-medium tabular-nums">
                {weekendSummary.total} min
              </span>{" "}
              · término às{" "}
              <span className="text-foreground font-medium tabular-nums">
                {weekendSummary.endTime}
              </span>
            </p>
            {canEdit && (
              <Button
                type="button"
                onClick={() => handleSave("WEEKEND")}
                disabled={saving !== null}
              >
                <Save aria-hidden="true" />
                {saving === "WEEKEND" ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir programação da semana?</DialogTitle>
            <DialogDescription>
              A programação do meio de semana e do fim de semana desta semana será removida
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteWeek}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
