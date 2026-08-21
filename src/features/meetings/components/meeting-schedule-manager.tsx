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
import type { CandidatePerson } from "@/features/meetings/lib/candidates";
import type { WorkbookContent } from "@/features/meetings/lib/jwpub";
import {
  type AssignmentKind,
  addMinutesToTime,
  articleStartDate,
  buildMidweekMeeting,
  buildWeekendMeeting,
  findWorkbookWeek,
  isoDay,
  type SongItem,
  type TalkItem,
  type WatchtowerArticleItem,
  weekStartUtc,
} from "@/features/meetings/lib/meeting-builder";
import {
  helperMatchesStudent,
  normalizePersonName,
  SLOT_RULES,
} from "@/features/meetings/lib/schedule-rules";
import type { ScheduleIssue } from "@/features/meetings/lib/schedule-validation";
import type { ScheduledMeetingData } from "@/features/meetings/lib/scheduled-meetings";
import type { MeetingSpecialEvent } from "@/features/meetings/lib/special-events";
import { effectiveScheduleDays } from "@/features/meetings/lib/special-events";
import type { ScheduledMeetingInput } from "@/features/meetings/schemas";
import type { MeetingType, WeekDay } from "@/generated/prisma/enums";
import { ScheduleSectionCard } from "./schedule-section-card";
import { SpecialEventBanner } from "./special-event-banner";
import { SpecialEventCard } from "./special-event-card";
import { WeekNav } from "./week-nav";

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "Segunda-feira",
  TUESDAY: "Terça-feira",
  WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira",
  FRIDAY: "Sexta-feira",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

/** Partes da visita do superintendente oradas pelo viajante. */
const VISIT_TRAVELER_SLOT_KINDS = new Set<AssignmentKind>([
  "discursoServicoVisita",
  "discursoPublicoVisita",
  "discursoFinalVisita",
]);

interface MeetingSchedule {
  midweekDay: WeekDay | null;
  midweekTime: string | null;
  weekendDay: WeekDay | null;
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
  roster,
  canEdit,
  weekStartIso,
  saved,
  specialEvent = null,
}: {
  organizationId: string;
  midweekWorkbooks: { symbol: string; content: WorkbookContent }[];
  watchtower: { symbol: string; articles: WatchtowerArticleItem[] } | null;
  schedule: MeetingSchedule;
  songs: SongItem[];
  talks: TalkItem[];
  roster: CandidatePerson[];
  canEdit: boolean;
  /** Semana (ISO) vinda da URL, normalizada no servidor. */
  weekStartIso: string;
  saved: ScheduledMeetingData[];
  /** Evento especial da semana, resolvido no servidor. */
  specialEvent?: MeetingSpecialEvent | null;
}) {
  const [tab, setTab] = useState<"midweek" | "weekend">("midweek");
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
  const [remoteIssues, setRemoteIssues] = useState<ScheduleIssue[]>([]);
  const [saving, setSaving] = useState<MeetingType | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentWeekIso = isoDay(weekStartUtc(new Date()));

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

  // Avisos do backend ficam obsoletos ao trocar de semana ou aba.
  const issueContextKey = `${weekStartIso}-${tab}`;
  const [prevIssueContextKey, setPrevIssueContextKey] = useState(issueContextKey);
  if (prevIssueContextKey !== issueContextKey) {
    setPrevIssueContextKey(issueContextKey);
    setRemoteIssues([]);
  }

  const midweekStartTime = schedule.midweekTime ?? "19:30";
  const weekendStartTime = schedule.weekendTime ?? "09:30";

  const midweekSections = useMemo(() => {
    if (!midweekMatch) return null;
    return buildMidweekMeeting(
      {
        week: midweekMatch.week,
        startTime: midweekStartTime,
        songs,
        middleSong,
      },
      { specialEvent },
    );
  }, [midweekMatch, midweekStartTime, songs, middleSong, specialEvent]);

  const weekendSections = useMemo(
    () =>
      buildWeekendMeeting(
        {
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
        },
        { specialEvent },
      ),
    [weekendStartTime, songs, talks, watchtower, weekendSelections, defaultArticleId, specialEvent],
  );

  const effectiveDays = effectiveScheduleDays(schedule, specialEvent);

  // Visita do superintendente: designa automaticamente o viajante nas partes
  // dele (discurso de serviço, discurso público e discurso final). O viajante
  // é o publicador `visitante` cadastrado a partir do evento; quando há mais
  // de um, prioriza o de mesmo nome configurado.
  useEffect(() => {
    if (specialEvent?.behavior !== "circuitOverseerVisit") return;
    const target = specialEvent.travelerName
      ? normalizePersonName(specialEvent.travelerName)
      : null;
    const match =
      (target
        ? roster.find((person) => person.visitante && normalizePersonName(person.nome) === target)
        : undefined) ?? roster.find((person) => person.visitante);
    if (!match) return;
    const sections = tab === "midweek" ? midweekSections : weekendSections;
    if (!sections) return;
    const travelerSlotIds = sections
      .flatMap((section) => section.parts)
      .flatMap((part) => part.slots)
      .filter((slot) => VISIT_TRAVELER_SLOT_KINDS.has(slot.kind))
      .map((slot) => slot.id);
    if (travelerSlotIds.length === 0) return;
    setAssignments((current) => {
      let changed = false;
      const next = { ...current };
      for (const slotId of travelerSlotIds) {
        if (!next[slotId]) {
          next[slotId] = match.id;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [specialEvent, roster, tab, midweekSections, weekendSections]);

  const activeSections = tab === "midweek" ? (midweekSections ?? []) : weekendSections;

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

  const slotKinds = useMemo(() => {
    const map: Record<string, AssignmentKind> = {};
    for (const section of [...(midweekSections ?? []), ...weekendSections]) {
      for (const part of section.parts) {
        for (const slot of part.slots) {
          map[slot.id] = slot.kind;
        }
      }
    }
    return map;
  }, [midweekSections, weekendSections]);

  /**
   * Verificações instantâneas no cliente (espelham o backend, que revalida
   * tudo no salvamento): duplicidade na mesma reunião, regra do ajudante e
   * conflito com a outra reunião da mesma semana.
   */
  const localIssues = useMemo(() => {
    const issues: ScheduleIssue[] = [];

    const slotsByPerson = new Map<string, string[]>();
    for (const section of activeSections) {
      for (const part of section.parts) {
        for (const slot of part.slots) {
          const personId = assignments[slot.id];
          if (!personId) continue;
          slotsByPerson.set(personId, [...(slotsByPerson.get(personId) ?? []), slot.id]);
        }
      }
    }
    for (const [personId, slotIds] of slotsByPerson) {
      if (slotIds.length < 2) continue;
      const name = roster.find((person) => person.id === personId)?.nome ?? "Publicador";
      for (const slotId of slotIds) {
        issues.push({
          partId: slotId,
          slotId,
          level: "warning",
          message: `${name} já possui outra designação nesta reunião.`,
        });
      }
    }

    const siblingType: MeetingType = tab === "midweek" ? "WEEKEND" : "MIDWEEK";
    const siblingPersonIds = new Set(
      savedMeetings
        .find(
          (meeting) => meeting.weekStart === weekStartIso && meeting.meetingType === siblingType,
        )
        ?.assignments.map((assignment) => assignment.personId) ?? [],
    );
    if (siblingPersonIds.size > 0) {
      const siblingLabel = siblingType === "WEEKEND" ? "fim de semana" : "meio de semana";
      const warned = new Set<string>();
      for (const section of activeSections) {
        for (const part of section.parts) {
          for (const slot of part.slots) {
            const personId = assignments[slot.id];
            if (!personId || !siblingPersonIds.has(personId) || warned.has(personId)) continue;
            warned.add(personId);
            const name = roster.find((person) => person.id === personId)?.nome ?? "Publicador";
            issues.push({
              partId: slot.id,
              slotId: null,
              level: "warning",
              message: `${name} também está designado na reunião de ${siblingLabel} desta semana.`,
            });
          }
        }
      }
    }

    for (const section of activeSections) {
      for (const part of section.parts) {
        const helperSlot = part.slots.find((slot) => SLOT_RULES[slot.kind]?.helper);
        if (!helperSlot) continue;
        const studentSlot = part.slots.find((slot) => slot.id !== helperSlot.id);
        const studentId = studentSlot ? assignments[studentSlot.id] : undefined;
        const helperId = assignments[helperSlot.id];
        if (!helperId || !studentId) continue;
        const student = roster.find((person) => person.id === studentId);
        const helper = roster.find((person) => person.id === helperId);
        if (!student || !helper) continue;
        const check = helperMatchesStudent(helper, student);
        if (!check.eligible) {
          issues.push({
            partId: helperSlot.id,
            slotId: helperSlot.id,
            level: "error",
            message:
              check.reason ??
              "Ajudante precisa possuir o mesmo sexo do estudante ou ser da família.",
          });
        }
      }
    }

    return issues;
  }, [activeSections, assignments, roster, savedMeetings, weekStartIso, tab]);

  const allIssues = useMemo(() => {
    const seen = new Set<string>();
    const merged: ScheduleIssue[] = [];
    for (const issue of [...localIssues, ...remoteIssues]) {
      const key = `${issue.slotId ?? ""}|${issue.partId ?? ""}|${issue.level}|${issue.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(issue);
    }
    return merged;
  }, [localIssues, remoteIssues]);

  const blockingErrors = allIssues.filter((issue) => issue.level === "error");
  const globalWarnings = allIssues.filter(
    (issue) => issue.level === "warning" && !issue.slotId && !issue.partId,
  );

  const midweekSummary = midweekSections ? meetingSummary(midweekSections) : null;
  const weekendSummary = meetingSummary(weekendSections);

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
          .filter(([slotId, personId]) => personId !== "" && slotKinds[slotId])
          .map(([slotId, personId]) => ({
            partId: slotId,
            label: slotLabels[slotId] ?? slotId,
            kind: slotKinds[slotId],
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
        const issues = Array.isArray(data?.issues) ? (data.issues as ScheduleIssue[]) : [];
        setRemoteIssues(issues);
        throw new Error(data?.error ?? "Erro ao salvar a programação.");
      }

      setRemoteIssues(Array.isArray(data?.warnings) ? (data.warnings as ScheduleIssue[]) : []);
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
      setRemoteIssues([]);
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
  const hideMeetings = specialEvent?.behavior === "hideMeetings";
  const coVisit = specialEvent?.behavior === "circuitOverseerVisit";

  if (hideMeetings && specialEvent) {
    return (
      <div className="space-y-6">
        <WeekNav
          weekStartIso={weekStartIso}
          makeHref={(weekIso) => `/dashboard/designacoes/reunioes/programar?week=${weekIso}`}
          currentWeekIso={currentWeekIso}
        />
        <SpecialEventCard event={specialEvent} />
      </div>
    );
  }

  const sharedCardProps = {
    roster,
    assignments,
    disabled: !canEdit,
    weekStartIso,
    issues: allIssues,
    onAssign: handleAssign,
    onControlChange: handleControlChange,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          Meio de semana:{" "}
          {effectiveDays.midweekDay ? WEEKDAY_LABELS[effectiveDays.midweekDay] : "não configurado"}
          {schedule.midweekTime ? ` · ${schedule.midweekTime}` : ""}
        </Badge>
        <Badge variant="secondary">
          Fim de semana:{" "}
          {effectiveDays.weekendDay ? WEEKDAY_LABELS[effectiveDays.weekendDay] : "não configurado"}
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
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="midweek">Meio de Semana</TabsTrigger>
          <TabsTrigger value="weekend">Fim de Semana</TabsTrigger>
        </TabsList>

        <div className="py-4">
          <WeekNav
            weekStartIso={weekStartIso}
            makeHref={(weekIso) => `/dashboard/designacoes/reunioes/programar?week=${weekIso}`}
            currentWeekIso={currentWeekIso}
          />
        </div>

        <TabsContent value="midweek" className="space-y-4">
          {coVisit && specialEvent && <SpecialEventBanner event={specialEvent} />}
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

          {globalWarnings.length > 0 && (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
              {globalWarnings.map((issue, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: avisos estáticos por render
                <p key={index} className="flex items-start gap-2 text-warning">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {issue.message}
                </p>
              ))}
            </div>
          )}

          {midweekSections && midweekSummary && (
            <>
              {midweekSections.map((section) => (
                <ScheduleSectionCard key={section.id} section={section} {...sharedCardProps} />
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
                <div className="space-y-1 text-right">
                  {blockingErrors.length > 0 && canEdit && (
                    <p className="text-destructive text-xs">
                      Corrija as inconsistências destacadas para salvar.
                    </p>
                  )}
                  {canEdit && (
                    <Button
                      type="button"
                      onClick={() => handleSave("MIDWEEK")}
                      disabled={saving !== null || blockingErrors.length > 0}
                    >
                      <Save aria-hidden="true" />
                      {saving === "MIDWEEK" ? "Salvando..." : "Salvar"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="weekend" className="space-y-4">
          {coVisit && specialEvent && <SpecialEventBanner event={specialEvent} />}
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
            <ScheduleSectionCard key={section.id} section={section} {...sharedCardProps} />
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
            <div className="space-y-1 text-right">
              {blockingErrors.length > 0 && canEdit && (
                <p className="text-destructive text-xs">
                  Corrija as inconsistências destacadas para salvar.
                </p>
              )}
              {canEdit && (
                <Button
                  type="button"
                  onClick={() => handleSave("WEEKEND")}
                  disabled={saving !== null || blockingErrors.length > 0}
                >
                  <Save aria-hidden="true" />
                  {saving === "WEEKEND" ? "Salvando..." : "Salvar"}
                </Button>
              )}
            </div>
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
