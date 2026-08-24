import { CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserAssignmentSummary } from "@/features/meetings/lib/user-assignments";
import { AssignmentItem } from "./assignment-item";

/**
 * Card principal do dashboard: designações da semana atual do usuário.
 */
export function WeeklyAssignmentsCard({ items }: { items: UserAssignmentSummary[] }) {
  return (
    <Card className="from-primary/10 via-primary/4 border-primary/30 bg-gradient-to-b to-transparent">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-xl tracking-tight">
          <CalendarCheck className="text-primary size-5" aria-hidden="true" />
          Minhas Designações da Semana
          {items.length > 0 && <Badge className="tabular-nums">{items.length}</Badge>}
        </CardTitle>
        <CardDescription>Suas partes nas reuniões desta semana.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground py-2 text-sm">
            Você não possui designações nesta semana.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <AssignmentItem
                key={`${item.meetingType}-${item.label}-${item.dateLabel}`}
                assignment={item}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
