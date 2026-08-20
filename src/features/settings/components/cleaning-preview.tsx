"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeekCleaning } from "@/features/settings/lib/cleaning";
import { formatDay, parseIsoDay } from "@/features/settings/lib/schedule";
import type { WeeklyCleaningData } from "@/features/settings/lib/types";

export function CleaningPreview({
  weeks,
  weekly,
}: {
  weeks: WeekCleaning[];
  weekly: WeeklyCleaningData;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumo das regras aplicadas</CardTitle>
        <CardDescription>
          Próximas semanas: como as limpezas serão aplicadas conforme as reuniões e eventos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {weeks.map((week) => {
          const badges: string[] = [];
          if (week.blockedBy) {
            badges.push(`Bloqueada por ${week.blockedBy}`);
          } else if (week.afterMeeting && week.reasonLabel) {
            badges.push(`Limpeza após reunião (${week.reasonLabel})`);
          }
          if (week.weekly && !week.weeklyCancelled && weekly.time) {
            for (const date of week.weeklyDatesInWeek) {
              badges.push(`Limpeza Semanal ${formatDay(parseIsoDay(date))} às ${weekly.time}`);
            }
          }
          if (week.weekly && week.weeklyCancelled && weekly.time) {
            badges.push("Semanal cancelada (Limpeza Geral)");
          }
          if (week.general) {
            badges.push(
              `Limpeza Geral ${formatDay(parseIsoDay(week.general.date))} às ${week.general.time}`,
            );
          }

          return (
            <div key={week.weekStart} className="rounded-lg border px-3 py-2.5">
              <p className="text-sm font-medium">
                Semana de {formatDay(parseIsoDay(week.weekStart))}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {badges.length === 0 ? (
                  <span className="text-muted-foreground text-xs">Sem limpeza.</span>
                ) : (
                  badges.map((badge, index) => (
                    <Badge
                      // biome-ignore lint/suspicious/noArrayIndexKey: badges derivadas por ordem fixa
                      key={index}
                      variant={week.blockedBy ? "destructive" : "secondary"}
                    >
                      {badge}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
