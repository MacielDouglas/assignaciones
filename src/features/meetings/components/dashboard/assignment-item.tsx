import { CalendarClock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UserAssignmentSummary } from "@/features/meetings/lib/user-assignments";
import { cn } from "@/lib/utils";

const MEETING_TYPE_LABEL = {
  MIDWEEK: "Meio de semana",
  WEEKEND: "Fim de semana",
} as const;

/**
 * Uma designação do usuário: parte, tipo de reunião, data, hora e ajudantes.
 */
export function AssignmentItem({
  assignment,
  compact = false,
}: {
  assignment: UserAssignmentSummary;
  compact?: boolean;
}) {
  return (
    <li className={cn("flex items-start gap-3", compact && "text-sm")}>
      <span
        aria-hidden="true"
        className={cn(
          "bg-primary/10 text-primary flex shrink-0 items-center justify-center rounded-xl",
          compact ? "size-9" : "size-11",
        )}
      >
        <CalendarClock className={compact ? "size-4" : "size-5"} />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className={cn("truncate font-semibold", compact ? "text-sm" : "text-base")}>
          {assignment.label}
        </p>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <Badge
            variant="outline"
            className={
              assignment.meetingType === "MIDWEEK"
                ? "border-primary/30 bg-primary/5 px-1.5 py-0 text-[10px] text-primary"
                : "border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-700 dark:text-amber-400"
            }
          >
            {MEETING_TYPE_LABEL[assignment.meetingType]}
          </Badge>
          <span className="tabular-nums">
            {assignment.weekdayLabel}, {assignment.dateLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{assignment.timeLabel}</span>
        </p>
        {assignment.helpers.length > 0 && (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="size-3" aria-hidden="true" />
            {assignment.helpers.length === 1 ? "Ajudante:" : "Ajudantes:"}{" "}
            <span className="font-medium text-foreground">{assignment.helpers.join(", ")}</span>
          </p>
        )}
      </div>
    </li>
  );
}
