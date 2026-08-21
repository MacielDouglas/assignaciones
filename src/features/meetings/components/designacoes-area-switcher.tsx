import { CalendarClock, ListChecks } from "lucide-react";
import Link from "next/link";
import type { DesignacoesArea } from "@/features/meetings/components/types";
import { cn } from "@/lib/utils";

const AREAS = [
  { key: "reunioes" as const, label: "Reuniões", icon: CalendarClock },
  { key: "designacoes" as const, label: "Designações", icon: ListChecks },
];

export function DesignacoesAreaSwitcher({
  active,
  makeHref,
}: {
  active: DesignacoesArea;
  makeHref: (area: DesignacoesArea) => string;
}) {
  return (
    <nav
      aria-label="Escolha entre reuniões e designações"
      className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-muted p-1"
    >
      {AREAS.map((area) => {
        const isActive = area.key === active;
        return (
          <Link
            key={area.key}
            href={makeHref(area.key)}
            aria-current={isActive ? "page" : undefined}
            prefetch
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm transition-colors",
              isActive
                ? "bg-card font-semibold text-foreground shadow-sm ring-1 ring-foreground/5"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <area.icon className="size-4" aria-hidden="true" />
            {area.label}
          </Link>
        );
      })}
    </nav>
  );
}
