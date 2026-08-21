import { Landmark, Luggage, Mic, UserStar } from "lucide-react";
import type { MeetingSpecialEvent } from "@/features/meetings/lib/special-events";
import {
  SPECIAL_EVENT_TITLES,
  specialEventPeriodLabel,
} from "@/features/meetings/lib/special-events";
import type { SpecialEventKind } from "@/generated/prisma/enums";

export const SPECIAL_EVENT_ICONS: Record<SpecialEventKind, typeof Landmark> = {
  CONVENTION: Landmark,
  ASSEMBLY_REPRESENTATIVE: Mic,
  ASSEMBLY_TRAVELING_OVERSEER: Luggage,
  CIRCUIT_OVERSEER_VISIT: UserStar,
  MEMORIAL: Landmark,
  SPECIAL_TALK: Mic,
};

/**
 * Banner premium exibido no topo das reuniões durante a visita do
 * superintendente de circuito.
 */
export function SpecialEventBanner({ event }: { event: MeetingSpecialEvent }) {
  const Icon = SPECIAL_EVENT_ICONS[event.kind];
  return (
    <aside
      aria-label={SPECIAL_EVENT_TITLES[event.kind]}
      className="from-primary/12 via-primary/5 relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r to-transparent p-4"
    >
      <div className="flex items-center gap-3">
        <span className="from-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br to-primary/70 shadow-sm">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-primary text-sm font-semibold tracking-tight">{event.title}</p>
          <p className="text-muted-foreground truncate text-xs">
            {event.travelerName ? `${event.travelerName} · ` : ""}
            {specialEventPeriodLabel(event)}
          </p>
        </div>
      </div>
    </aside>
  );
}
