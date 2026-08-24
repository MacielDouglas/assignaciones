import { CalendarDays } from "lucide-react";
import type { MeetingSpecialEvent } from "@/features/meetings/lib/special-events";
import {
  SPECIAL_EVENT_TITLES,
  specialEventPeriodLabel,
} from "@/features/meetings/lib/special-events";
import { SPECIAL_EVENT_ICONS } from "./special-event-banner";

const INSPIRING_MESSAGE =
  "Reserve tempo para aproveitar plenamente este evento especial. Programas como congressos e assembleias fortalecem nossa fé, aumentam nossa alegria e nos aproximam ainda mais de Jeová e dos irmãos.";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card/70 rounded-xl border px-4 py-3 text-left">
      <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm leading-snug font-medium">{value}</dd>
    </div>
  );
}

/**
 * Card especial exibido no lugar das reuniões quando a semana tem congresso
 * ou assembleia — não há reuniões regulares nem programação nessa semana.
 */
export function SpecialEventCard({ event }: { event: MeetingSpecialEvent }) {
  const Icon = SPECIAL_EVENT_ICONS[event.kind];
  const headingId = `special-event-heading-${event.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="from-primary/12 via-primary/5 anim-rise-in relative overflow-hidden rounded-3xl border bg-linear-to-b to-transparent px-6 py-10 sm:px-10 sm:py-14"
    >
      <div
        aria-hidden="true"
        className="from-primary/20 pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-72 rounded-full bg-linear-to-b to-transparent blur-3xl"
      />
      <div className="relative mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="from-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br to-primary/60 shadow-lg shadow-primary/20">
          <Icon className="size-8" aria-hidden="true" />
        </span>

        <h2
          id={headingId}
          className="mt-5 text-2xl font-bold tracking-tight text-balance sm:text-3xl"
        >
          Evento Especial da Semana
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
          Esta semana não possui reuniões regulares da congregação.
        </p>

        <p className="text-muted-foreground mt-6 max-w-lg text-sm leading-relaxed">
          {INSPIRING_MESSAGE}
        </p>

        <dl className="mt-8 grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          <Detail label="Evento" value={event.title || SPECIAL_EVENT_TITLES[event.kind]} />
          <Detail label="Local" value={event.location ?? "A confirmar"} />
          <Detail
            label="Data e horário"
            value={
              event.time
                ? `${specialEventPeriodLabel(event)} · ${event.time}`
                : specialEventPeriodLabel(event)
            }
          />
        </dl>

        <p className="text-muted-foreground mt-6 flex items-center gap-1.5 text-xs">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          Confira o programa oficial do evento para os horários de cada dia.
        </p>
      </div>
    </section>
  );
}
