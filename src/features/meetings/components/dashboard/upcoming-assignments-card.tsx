import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserAssignmentSummary } from "@/features/meetings/lib/user-assignments";
import { AssignmentItem } from "./assignment-item";

/**
 * Card secundário: designações da próxima semana (menor destaque).
 */
export function UpcomingAssignmentsCard({ items }: { items: UserAssignmentSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground flex flex-wrap items-center gap-2 text-base tracking-tight">
          <CalendarClock className="size-4" aria-hidden="true" />
          Próximas Designações
          {items.length > 0 && (
            <Badge variant="outline" className="tabular-nums">
              {items.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Partes já programadas para a próxima semana.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground py-1 text-sm">
            Nenhuma designação na próxima semana.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <AssignmentItem
                key={`${item.meetingType}-${item.label}-${item.dateLabel}`}
                assignment={item}
                compact
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
