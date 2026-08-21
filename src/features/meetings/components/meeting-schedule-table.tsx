import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MeetingPart, MeetingSection } from "@/features/meetings/lib/meeting-builder";
import { weekdayLabel } from "@/features/meetings/lib/meeting-builder";
import type { WeekDay } from "@/generated/prisma/enums";

function ScheduleRow({
  part,
  assignments,
}: {
  part: MeetingPart;
  assignments?: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-3 py-2">
      <span className="text-muted-foreground pt-0.5 text-sm tabular-nums">{part.time ?? "—"}</span>
      <div className="min-w-0">
        <p className="text-sm leading-snug font-medium">
          {part.title}
          {part.duration > 0 && (
            <span className="text-muted-foreground text-xs font-normal">
              {" "}
              · {part.duration} min
            </span>
          )}
        </p>
        {part.subtitle && (
          <p className="text-muted-foreground text-xs leading-snug">{part.subtitle}</p>
        )}
      </div>
      <div className="text-right">
        {part.song?.number ? (
          <p className="text-muted-foreground text-xs">Cântico {part.song.number}</p>
        ) : null}
        {part.slots.length > 0 && (
          <div className="space-y-0.5">
            {part.slots.map((slot) => {
              const personName = assignments?.[slot.id];
              return (
                <p key={slot.id} className="text-xs">
                  <span className="text-muted-foreground">{slot.label}:</span>{" "}
                  {personName ? (
                    <span className="font-medium">{personName}</span>
                  ) : (
                    <span className="text-warning font-medium">—</span>
                  )}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function MeetingScheduleTable({
  title,
  day,
  time,
  fallbackTime,
  sections,
  assignments,
}: {
  title: string;
  day: WeekDay | null;
  time: string | null;
  fallbackTime: string;
  sections: MeetingSection[];
  assignments?: Record<string, string>;
}) {
  const total = sections.reduce(
    (sum, section) => sum + section.parts.reduce((a, part) => a + part.duration, 0),
    0,
  );
  const dayLabel = weekdayLabel(day) ?? "Dia não configurado";
  const timeLabel = time ?? `${fallbackTime} (padrão)`;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {dayLabel} · {timeLabel}
          </Badge>
          <Badge variant="outline">Total: {total} min</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sections.map((section) => (
          <div key={section.id} className="border-t px-4 py-3 first:border-t-0 sm:px-6">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {section.title}
              </h3>
              {section.subtitle && (
                <span className="text-muted-foreground text-xs">{section.subtitle}</span>
              )}
            </div>
            <div className="divide-y">
              {section.parts.map((part) => (
                <ScheduleRow key={part.id} part={part} assignments={assignments} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
