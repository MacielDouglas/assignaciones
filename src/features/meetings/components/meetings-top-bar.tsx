import { CalendarDays, Check, ChevronLeft, ChevronRight, Cloud } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  addDaysUtc,
  formatDateBR,
  isoDay,
  parseIsoDay,
} from "@/features/meetings/lib/meeting-builder";
import { cn } from "@/lib/utils";

function relativeWeekLabel(viewedIso: string, currentIso: string): string | null {
  if (viewedIso === currentIso) return "semana atual";
  const days = (parseIsoDay(viewedIso).getTime() - parseIsoDay(currentIso).getTime()) / 86_400_000;
  const weeks = Math.round(days / 7);
  if (weeks === -1) return "semana passada";
  if (weeks === 1) return "próxima semana";
  return null;
}

function shortWeekDate(weekStartIso: string): string {
  const date = parseIsoDay(weekStartIso);
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Cabeçalho superior da página de reuniões: faixa azul com navegação entre
 * semanas (anterior/atual/próxima) e a referência bíblica da semana.
 *
 * Server component — a navegação acontece por links (`?week=`), sem estado.
 */
export function MeetingsTopBar({
  weekStartIso,
  makeHref,
  currentWeekIso,
  bibleReading,
}: {
  weekStartIso: string;
  makeHref: (weekIso: string) => string;
  currentWeekIso?: string;
  bibleReading?: string | null;
}) {
  const isCurrentWeek = !currentWeekIso || weekStartIso === currentWeekIso;
  const relative = currentWeekIso ? relativeWeekLabel(weekStartIso, currentWeekIso) : null;
  const previousHref = makeHref(isoDay(addDaysUtc(parseIsoDay(weekStartIso), -7)));
  const nextHref = makeHref(isoDay(addDaysUtc(parseIsoDay(weekStartIso), 7)));

  return (
    <header className="bg-linear-to-b from-primary to-primary/85 text-primary-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 pb-4 pt-3 sm:px-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground focus-visible:ring-white/60"
            asChild
          >
            <Link href={previousHref} aria-label="Semana anterior" prefetch>
              <ChevronLeft />
            </Link>
          </Button>

          <div className="min-w-0 text-center" aria-live="polite">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
              Semana de {shortWeekDate(weekStartIso)}
              <span className="sr-only">
                {" "}
                ({formatDateBR(parseIsoDay(weekStartIso))}
                {relative ? ` · ${relative}` : ""})
              </span>
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground focus-visible:ring-white/60"
            asChild
          >
            <Link href={nextHref} aria-label="Próxima semana" prefetch>
              <ChevronRight />
            </Link>
          </Button>
        </div>

        {bibleReading ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p
              className="min-w-0 truncate text-base font-extrabold tracking-[0.12em] uppercase sm:text-lg"
              title={bibleReading}
            >
              {bibleReading}
            </p>
            <span
              role="img"
              aria-label="Conteúdo carregado da apostila da semana"
              className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15"
            >
              <Cloud className="size-5" aria-hidden="true" />
              <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary">
                <Check className="size-2.5 text-primary-foreground" aria-hidden="true" />
              </span>
            </span>
          </div>
        ) : (
          <div className="mt-2 h-6 sm:h-7" aria-hidden="true" />
        )}

        {!isCurrentWeek && currentWeekIso && (
          <div className="mt-3 flex justify-center">
            <Button
              size="sm"
              className={cn(
                "h-9 rounded-full bg-white/95 text-primary shadow-sm hover:bg-white",
                "focus-visible:ring-white/60",
              )}
              asChild
            >
              <Link
                href={makeHref(currentWeekIso)}
                prefetch
                aria-label="Voltar para a semana atual"
              >
                <CalendarDays aria-hidden="true" />
                Semana atual
              </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
