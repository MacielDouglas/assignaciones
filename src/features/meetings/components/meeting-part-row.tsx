import { ChevronRight } from "lucide-react";
import {
  type MeetingSectionTheme,
  sectionDividerVar,
  timeCapsuleStyle,
} from "@/features/meetings/components/meeting-section-theme";
import type { MeetingPart } from "@/features/meetings/lib/meeting-builder";

function AssigneeName({ name }: { name: string | undefined }) {
  if (name) {
    return <span className="text-foreground text-xs leading-snug font-semibold">{name}</span>;
  }
  return (
    <>
      <span className="text-warning text-xs leading-snug font-semibold">———</span>
      <span className="sr-only"> sem designação</span>
    </>
  );
}

/**
 * Linha compacta da programação: cápsula de horário, conteúdo principal
 * (título, subtítulo, duração e cântico) e responsáveis à direita.
 *
 * No mobile os responsáveis descem para uma segunda linha para manter a
 * legibilidade; no desktop viram uma coluna alinhada à direita.
 */
export function MeetingPartRow({
  part,
  assignments,
  theme,
}: {
  part: MeetingPart;
  assignments?: Record<string, string>;
  theme: MeetingSectionTheme;
}) {
  const songNumber = part.song?.number && part.song.number > 0 ? part.song.number : null;
  const subtitle = part.subtitle ?? part.song?.theme ?? null;
  const meta = [
    part.duration > 0 ? `${part.duration} min` : null,
    songNumber ? `Cântico ${songNumber}` : null,
  ].filter(Boolean);

  return (
    <li
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 px-3 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_11rem_auto] sm:px-4"
      style={sectionDividerVar(theme)}
    >
      <span
        className="col-start-1 row-start-1 flex h-9 w-14 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums"
        style={timeCapsuleStyle(theme)}
      >
        {part.time ?? "—"}
      </span>

      <div className="col-start-2 row-start-1 min-w-0">
        <p className="text-sm leading-snug font-semibold">{part.title}</p>
        {subtitle && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-snug">
            {subtitle}
          </p>
        )}
        {meta.length > 0 && (
          <p className="text-muted-foreground/90 mt-0.5 text-[11px] font-medium tabular-nums">
            {meta.join(" · ")}
          </p>
        )}
      </div>

      {part.slots.length > 0 && (
        <div className="col-span-2 col-start-2 row-start-2 min-w-0 space-y-0.5 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:text-right">
          {part.slots.map((slot) => {
            const personName = assignments?.[slot.id];
            return (
              <p key={slot.id} className="truncate text-xs leading-snug">
                <span className="text-muted-foreground">{slot.label}: </span>
                <AssigneeName name={personName} />
              </p>
            );
          })}
        </div>
      )}

      <ChevronRight
        className="text-muted-foreground/60 col-start-3 row-start-1 size-5 shrink-0 self-center sm:col-start-4"
        aria-hidden="true"
      />
    </li>
  );
}
