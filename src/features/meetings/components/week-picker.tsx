"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addDaysUtc,
  formatDateBR,
  isoDay,
  parseIsoDay,
} from "@/features/meetings/lib/meeting-builder";

export function WeekPicker({
  weekStartIso,
  onChange,
  weeks,
}: {
  weekStartIso: string;
  onChange: (iso: string) => void;
  weeks: { title: string; date: string }[];
}) {
  const weekStart = parseIsoDay(weekStartIso);
  const weekEnd = addDaysUtc(weekStart, 6);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Semana anterior"
        onClick={() => onChange(isoDay(addDaysUtc(weekStart, -7)))}
      >
        <ChevronLeft />
      </Button>
      <Input
        type="date"
        value={weekStartIso}
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value);
        }}
        className="w-auto"
        aria-label="Data da semana"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Próxima semana"
        onClick={() => onChange(isoDay(addDaysUtc(weekStart, 7)))}
      >
        <ChevronRight />
      </Button>
      <p className="text-muted-foreground text-sm">
        Semana de {formatDateBR(weekStart)} a {formatDateBR(weekEnd)}
      </p>
      {weeks.length > 0 && (
        <Select value={weekStartIso} onValueChange={onChange}>
          <SelectTrigger className="w-auto min-w-52">
            <SelectValue placeholder="Semana da apostila" />
          </SelectTrigger>
          <SelectContent>
            {weeks.map((week) => (
              <SelectItem key={week.date} value={week.date}>
                {week.title} — {formatDateBR(parseIsoDay(week.date))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
