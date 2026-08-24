import { CalendarCog, ChevronRight, FilePlus2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MeetingSectionBlock } from "@/features/meetings/components/meeting-section";
import type { MeetingSection } from "@/features/meetings/lib/meeting-builder";
import { weekdayLabel } from "@/features/meetings/lib/meeting-builder";
import type { WeekDay } from "@/generated/prisma/enums";

const PRESIDENT_SLOT_KINDS = new Set(["presidente", "presidenteReuniaoPublica"]);

interface PresidentInfo {
  name: string | undefined;
  found: boolean;
}

function findPresident(
  sections: MeetingSection[],
  assignments: Record<string, string> | undefined,
): PresidentInfo {
  for (const section of sections) {
    for (const part of section.parts) {
      for (const slot of part.slots) {
        if (PRESIDENT_SLOT_KINDS.has(slot.kind)) {
          return { name: assignments?.[slot.id], found: true };
        }
      }
    }
  }
  return { name: undefined, found: false };
}

function ProgressDots({ assigned, total }: { assigned: number; total: number }) {
  const filled = total > 0 ? Math.round((assigned / total) * 3) : 0;
  const dots = [0, 1, 2];

  return (
    <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
      {dots.map((dot) => (
        <span
          key={dot}
          className={
            dot < filled
              ? "size-2 rounded-full bg-primary"
              : "size-2 rounded-full border-[1.5px] border-primary/45"
          }
        />
      ))}
    </span>
  );
}

/**
 * Programação de uma reunião em formato de tela de aplicativo: faixa de
 * identificação com indicadores de progresso e ações, linha do presidente
 * e seções coloridas com as partes da reunião.
 *
 * Server component — `canEdit` é resolvido no servidor; o cliente recebe
 * apenas o resultado (render ou não dos botões de ação).
 */
export function MeetingScheduleCard({
  title,
  day,
  time,
  fallbackTime,
  sections,
  assignments,
  canEdit = false,
  programHref,
  importHref,
}: {
  title: string;
  day: WeekDay | null;
  time: string | null;
  fallbackTime: string;
  sections: MeetingSection[];
  assignments?: Record<string, string>;
  canEdit?: boolean;
  programHref?: string;
  importHref?: string;
}) {
  const totalMinutes = sections.reduce(
    (sum, section) => sum + section.parts.reduce((acc, part) => acc + part.duration, 0),
    0,
  );
  const slotsTotal = sections.reduce(
    (sum, section) => sum + section.parts.reduce((acc, part) => acc + part.slots.length, 0),
    0,
  );
  const slotsAssigned = sections.reduce(
    (sum, section) =>
      sum +
      section.parts.reduce(
        (acc, part) => acc + part.slots.filter((slot) => assignments?.[slot.id]).length,
        0,
      ),
    0,
  );
  const president = findPresident(sections, assignments);
  const dayLabel = weekdayLabel(day);
  const timeLabel = time ?? fallbackTime;

  return (
    <div className="space-y-2.5">
      <section aria-label={title} className="bg-card overflow-hidden rounded-2xl border shadow-xs">
        <div className="flex items-center gap-2 px-3 py-2 sm:gap-2.5 sm:px-4 sm:py-2.5">
          <ProgressDots assigned={slotsAssigned} total={slotsTotal} />
          <span className="sr-only">
            {slotsAssigned} de {slotsTotal} designações preenchidas
          </span>

          <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold tracking-wide uppercase sm:text-sm">
            {dayLabel && <span className="text-primary">{dayLabel}</span>}
            {dayLabel && <span className="text-muted-foreground font-medium"> · </span>}
            {title}
          </h2>

          <span
            className="bg-secondary text-secondary-foreground shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
            title="Horário da reunião"
          >
            {timeLabel}
          </span>

          {totalMinutes > 0 && (
            <span className="text-muted-foreground hidden shrink-0 text-xs tabular-nums lg:inline">
              Total: {totalMinutes} min
            </span>
          )}

          {canEdit && (
            <>
              {programHref && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-10 [&_svg:not([class*='size-'])]:size-[18px]"
                  asChild
                >
                  <Link href={programHref} aria-label={`Programar ${title.toLowerCase()}`}>
                    <CalendarCog aria-hidden="true" />
                  </Link>
                </Button>
              )}
              {importHref && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-10 [&_svg:not([class*='size-'])]:size-[18px]"
                  asChild
                >
                  <Link href={importHref} aria-label="Importar conteúdo da apostila">
                    <FilePlus2 aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>

        {president.found && (
          <div className="border-border flex items-center justify-between gap-3 border-t px-3 py-2 sm:px-4">
            <span className="text-muted-foreground shrink-0 text-xs font-semibold tracking-wide uppercase">
              Presidente
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              {president.name ? (
                <span className="truncate text-sm font-semibold">{president.name}</span>
              ) : (
                <>
                  <span className="text-warning text-sm font-semibold">———</span>
                  <span className="sr-only">Presidente ainda não designado</span>
                </>
              )}
              <ChevronRight
                className="text-muted-foreground/60 size-4 shrink-0"
                aria-hidden="true"
              />
            </span>
          </div>
        )}
      </section>

      <ol className="space-y-2.5">
        {sections.map((section) => (
          <MeetingSectionBlock key={section.id} section={section} assignments={assignments} />
        ))}
      </ol>
    </div>
  );
}
