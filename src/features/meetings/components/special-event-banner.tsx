import { Landmark, Luggage, Mic, UserStar } from "lucide-react";
import { SECTION_NEUTRAL_COLOR } from "@/features/meetings/components/meeting-section-theme";
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
 * Banner exibido no topo das reuniões durante eventos especiais
 * (ex.: visita do superintendente de circuito).
 *
 * Visual dentro do design system: cartão hairline com tile ardósia sólida,
 * sem gradientes nem halos — a cor azul fica reservada para ação.
 */
export function SpecialEventBanner({ event }: { event: MeetingSpecialEvent }) {
  const Icon = SPECIAL_EVENT_ICONS[event.kind];
  return (
    <aside
      aria-label={SPECIAL_EVENT_TITLES[event.kind]}
      className="bg-card relative overflow-hidden rounded-2xl border p-4"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
          style={{ backgroundColor: SECTION_NEUTRAL_COLOR }}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">{event.title}</p>
          <p className="text-muted-foreground truncate text-xs">
            {event.travelerName ? `${event.travelerName} · ` : ""}
            {specialEventPeriodLabel(event)}
          </p>
        </div>
      </div>
    </aside>
  );
}
