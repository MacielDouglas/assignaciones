"use client";

import { Calendar } from "@/components/ui/calendar";
import {
  isoFromLocalDate,
  localDateFromIso,
  monthKeyOfIso,
  weekKeyOfIso,
} from "@/features/settings/lib/schedule";

const SCHEDULED_CLASS =
  "relative after:pointer-events-none after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary";

export function CleaningDatePicker({
  mode,
  selected,
  scheduled,
  onSelect,
  disabled,
}: {
  mode: "weekly" | "general";
  selected: string[];
  scheduled: string[];
  onSelect: (dates: string[]) => void;
  disabled?: (date: Date) => boolean;
}) {
  const today = isoFromLocalDate(new Date());

  function isBlocked(date: Date): boolean {
    const iso = isoFromLocalDate(date);
    if (iso < today) return true;
    if (mode === "weekly") {
      const week = weekKeyOfIso(iso);
      return selected.some((item) => weekKeyOfIso(item) === week && item !== iso);
    }
    const month = monthKeyOfIso(iso);
    return selected.some((item) => monthKeyOfIso(item) === month && item !== iso);
  }

  return (
    <Calendar
      mode="multiple"
      selected={selected.map(localDateFromIso)}
      onSelect={(picked) => {
        onSelect((picked ?? []).map(isoFromLocalDate).sort());
      }}
      disabled={(date) => isBlocked(date) || (disabled ? disabled(date) : false)}
      modifiers={{ scheduled: scheduled.map(localDateFromIso) }}
      modifiersClassNames={{ scheduled: SCHEDULED_CLASS }}
    />
  );
}
