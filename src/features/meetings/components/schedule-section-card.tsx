"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CandidatePerson } from "@/features/meetings/lib/candidates";
import type {
  AssignmentKind,
  MeetingPart,
  MeetingSection,
} from "@/features/meetings/lib/meeting-builder";
import { SLOT_RULES } from "@/features/meetings/lib/schedule-rules";
import type { ScheduleIssue } from "@/features/meetings/lib/schedule-validation";
import { cn } from "@/lib/utils";
import { PeoplePicker } from "./people-picker";
import { accentBackground, accentBorder, SECTION_ACCENTS } from "./section-accent";

function SlotIssues({
  slotId,
  partId,
  issues,
}: {
  slotId: string;
  partId: string;
  issues: ScheduleIssue[];
}) {
  const relevant = issues.filter(
    (issue) => issue.slotId === slotId || (!issue.slotId && issue.partId === partId),
  );
  if (relevant.length === 0) return null;
  return (
    <div className="space-y-1">
      {relevant.map((issue) => (
        <p
          key={`${issue.slotId}-${issue.level}-${issue.message}`}
          className={cn(
            "flex items-start gap-1 text-xs leading-snug",
            issue.level === "error" ? "text-destructive" : "text-warning",
          )}
        >
          <span aria-hidden="true">•</span>
          {issue.message}
        </p>
      ))}
    </div>
  );
}

function SlotField({
  slot,
  part,
  roster,
  assignments,
  disabled,
  weekStartIso,
  issues,
  onAssign,
}: {
  slot: { id: string; label: string; kind: AssignmentKind };
  part: MeetingPart;
  roster: CandidatePerson[];
  assignments: Record<string, string>;
  disabled: boolean;
  weekStartIso: string;
  issues: ScheduleIssue[];
  onAssign: (slotId: string, personId: string) => void;
}) {
  const rule = SLOT_RULES[slot.kind];
  const studentSlotId = `${part.id}-student`;
  const student = rule.helper
    ? (roster.find((person) => person.id === assignments[studentSlotId]) ?? null)
    : null;

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium">{slot.label}</p>
      <PeoplePicker
        kind={slot.kind}
        label={slot.label}
        roster={roster}
        student={student}
        value={assignments[slot.id] ?? ""}
        disabled={disabled}
        weekStartIso={weekStartIso}
        onSelect={(personId) => onAssign(slot.id, personId)}
      />
      <SlotIssues slotId={slot.id} partId={part.id} issues={issues} />
    </div>
  );
}

function PartRow({
  part,
  roster,
  assignments,
  disabled,
  weekStartIso,
  issues,
  onAssign,
  onControlChange,
}: {
  part: MeetingPart;
  roster: CandidatePerson[];
  assignments: Record<string, string>;
  disabled: boolean;
  weekStartIso: string;
  issues: ScheduleIssue[];
  onAssign: (slotId: string, personId: string) => void;
  onControlChange: (partId: string, value: string) => void;
}) {
  return (
    <li className="grid gap-2 py-3 sm:grid-cols-[3.5rem_1fr_13rem] sm:items-start sm:gap-4">
      <p className="text-muted-foreground pt-1 text-sm tabular-nums">{part.time ?? "—"}</p>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium">{part.title}</p>
          {part.duration > 0 && <Badge variant="outline">{part.duration} min</Badge>}
        </div>
        {part.subtitle && <p className="text-muted-foreground text-xs">{part.subtitle}</p>}
        {part.song && part.song.number > 0 && (
          <p className="text-muted-foreground text-xs">
            Cântico {part.song.number}
            {part.song.theme ? ` — ${part.song.theme}` : ""}
          </p>
        )}
        {part.select && (
          <Select
            value={part.select.value}
            onValueChange={(value) => onControlChange(part.id, value)}
            disabled={disabled || part.select.options.length === 0}
          >
            <SelectTrigger className="h-9 w-full max-w-md text-sm" aria-label={part.title}>
              <SelectValue placeholder="Selecionar…" />
            </SelectTrigger>
            <SelectContent>
              {part.select.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-2">
        {part.slots.length === 0 && <p className="text-muted-foreground text-xs">Sem designado</p>}
        {part.slots.map((slot) => (
          <SlotField
            key={slot.id}
            slot={slot}
            part={part}
            roster={roster}
            assignments={assignments}
            disabled={disabled}
            weekStartIso={weekStartIso}
            issues={issues}
            onAssign={onAssign}
          />
        ))}
      </div>
    </li>
  );
}

interface SectionCardProps {
  section: MeetingSection;
  roster: CandidatePerson[];
  assignments: Record<string, string>;
  disabled: boolean;
  weekStartIso: string;
  issues: ScheduleIssue[];
  onAssign: (slotId: string, personId: string) => void;
  onControlChange: (partId: string, value: string) => void;
}

export function ScheduleSectionCard(props: SectionCardProps) {
  const { section } = props;
  const assignedCount = section.parts.reduce(
    (sum, part) => sum + part.slots.filter((slot) => props.assignments[slot.id]).length,
    0,
  );
  const totalCount = section.parts.reduce((sum, part) => sum + part.slots.length, 0);

  if (section.accent === "neutral") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            {section.title}
            {totalCount > 0 && (
              <Badge variant="outline" className="tabular-nums">
                {assignedCount}/{totalCount} designados
              </Badge>
            )}
          </CardTitle>
          {section.subtitle && <CardDescription>{section.subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>
          <PartsList {...props} />
        </CardContent>
      </Card>
    );
  }

  const theme = SECTION_ACCENTS[section.accent];

  return (
    <Accordion type="single" collapsible defaultValue={section.id}>
      <AccordionItem
        value={section.id}
        className="overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: accentBackground(theme.color),
          borderColor: accentBorder(theme.color),
        }}
      >
        <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-5">
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
              style={{ backgroundColor: theme.color }}
            >
              <theme.Icon className="size-5 text-white" />
            </span>
            <span className="min-w-0 flex-1 space-y-0.5 text-left">
              <span className="block truncate text-sm font-semibold tracking-tight sm:text-base">
                {section.title}
              </span>
              <span className="text-muted-foreground block text-xs">{section.subtitle}</span>
            </span>
            <Badge
              variant="outline"
              className="shrink-0 border-transparent tabular-nums"
              style={{
                backgroundColor: `color-mix(in srgb, ${theme.color} 14%, transparent)`,
                color: theme.color,
              }}
            >
              {assignedCount}/{totalCount}
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 sm:px-5">
          <PartsList {...props} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function PartsList({
  section,
  roster,
  assignments,
  disabled,
  weekStartIso,
  issues,
  onAssign,
  onControlChange,
}: SectionCardProps) {
  return (
    <ol className="divide-y">
      {section.parts.map((part) => (
        <PartRow
          key={part.id}
          part={part}
          roster={roster}
          assignments={assignments}
          disabled={disabled}
          weekStartIso={weekStartIso}
          issues={issues}
          onAssign={onAssign}
          onControlChange={onControlChange}
        />
      ))}
    </ol>
  );
}
