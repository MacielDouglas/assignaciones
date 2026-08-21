import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  addDaysUtc,
  formatDateBR,
  isoDay,
  parseIsoDay,
} from "@/features/meetings/lib/meeting-builder";

function relativeWeekLabel(viewedIso: string, currentIso: string): string | null {
  if (viewedIso === currentIso) return "semana atual";
  const days = (parseIsoDay(viewedIso).getTime() - parseIsoDay(currentIso).getTime()) / 86_400_000;
  const weeks = Math.round(days / 7);
  if (weeks === -1) return "semana passada";
  if (weeks === 1) return "próxima semana";
  return null;
}

export function WeekNav({
  weekStartIso,
  makeHref,
  currentWeekIso,
}: {
  weekStartIso: string;
  makeHref: (weekIso: string) => string;
  currentWeekIso?: string;
}) {
  const weekStart = parseIsoDay(weekStartIso);
  const weekEnd = addDaysUtc(weekStart, 6);
  const relative = currentWeekIso ? relativeWeekLabel(weekStartIso, currentWeekIso) : null;

  return (
    <nav
      aria-label="Navegação entre semanas"
      className="flex items-center justify-between gap-2 rounded-2xl border bg-card px-2 py-2"
    >
      <Button variant="ghost" size="icon" className="rounded-full" asChild>
        <Link
          href={makeHref(isoDay(addDaysUtc(weekStart, -7)))}
          aria-label="Semana anterior"
          prefetch
        >
          <ChevronLeft />
        </Link>
      </Button>
      <p className="text-sm font-medium tabular-nums" aria-live="polite">
        Semana de {formatDateBR(weekStart)} a {formatDateBR(weekEnd)}
        {relative && <span className="text-muted-foreground font-normal"> · {relative}</span>}
      </p>
      <Button variant="ghost" size="icon" className="rounded-full" asChild>
        <Link
          href={makeHref(isoDay(addDaysUtc(weekStart, 7)))}
          aria-label="Próxima semana"
          prefetch
        >
          <ChevronRight />
        </Link>
      </Button>
    </nav>
  );
}
