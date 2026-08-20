"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ASSIGNMENT_FILTERS,
  type AssignmentSlot,
  type MeetingPart,
  type MeetingSection,
  type SchedulePerson,
} from "@/features/meetings/lib/meeting-builder";

function SlotSelect({
  slot,
  people,
  value,
  disabled,
  onSelect,
}: {
  slot: AssignmentSlot;
  people: SchedulePerson[];
  value: string;
  disabled: boolean;
  onSelect: (personId: string) => void;
}) {
  const candidates = people.filter(ASSIGNMENT_FILTERS[slot.kind]);

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{slot.label}</p>
      <Select value={value} onValueChange={onSelect} disabled={disabled || candidates.length === 0}>
        <SelectTrigger
          className="h-8 w-full text-sm"
          aria-label={
            candidates.length === 0 ? `${slot.label}: nenhuma pessoa habilitada` : slot.label
          }
        >
          <SelectValue
            placeholder={candidates.length === 0 ? "Ninguém habilitado" : "Selecionar..."}
          />
        </SelectTrigger>
        <SelectContent>
          {candidates.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              {person.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PartRow({
  part,
  people,
  assignments,
  disabled,
  onAssign,
  onControlChange,
}: {
  part: MeetingPart;
  people: SchedulePerson[];
  assignments: Record<string, string>;
  disabled: boolean;
  onAssign: (slotId: string, personId: string) => void;
  onControlChange: (partId: string, value: string) => void;
}) {
  return (
    <li className="grid gap-1.5 py-3 sm:grid-cols-[4.5rem_1fr_14rem] sm:items-start sm:gap-4">
      <p className="font-mono text-muted-foreground text-sm tabular-nums">{part.time ?? "—"}</p>
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
            <SelectTrigger className="h-8 w-full max-w-md text-sm" aria-label={part.title}>
              <SelectValue placeholder="Selecionar..." />
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
          <SlotSelect
            key={slot.id}
            slot={slot}
            people={people}
            value={assignments[slot.id] ?? ""}
            disabled={disabled}
            onSelect={(personId) => onAssign(slot.id, personId)}
          />
        ))}
      </div>
    </li>
  );
}

export function MeetingSectionCard({
  section,
  people,
  assignments,
  disabled,
  onAssign,
  onControlChange,
}: {
  section: MeetingSection;
  people: SchedulePerson[];
  assignments: Record<string, string>;
  disabled: boolean;
  onAssign: (slotId: string, personId: string) => void;
  onControlChange: (partId: string, value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{section.title}</CardTitle>
        {section.subtitle && <CardDescription>{section.subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ol className="divide-y">
          {section.parts.map((part) => (
            <PartRow
              key={part.id}
              part={part}
              people={people}
              assignments={assignments}
              disabled={disabled}
              onAssign={onAssign}
              onControlChange={onControlChange}
            />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
