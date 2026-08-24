import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Seção reservada para uma funcionalidade futura do dashboard
 * (ex.: designações de trabalho e de limpeza).
 */
export function PlaceholderSection({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <Card className="border-border/70 border-dashed bg-transparent shadow-none">
      <CardContent className="flex items-center gap-3 py-5">
        <span
          aria-hidden="true"
          className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-xl"
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground text-xs">{description ?? "Em breve."}</p>
        </div>
      </CardContent>
    </Card>
  );
}
