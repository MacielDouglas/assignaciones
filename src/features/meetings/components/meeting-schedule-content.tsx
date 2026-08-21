import { CalendarCog } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingScheduleTable } from "@/features/meetings/components/meeting-schedule-table";
import { MeetingTabs } from "@/features/meetings/components/meeting-tabs";
import { ScheduleWeekNav } from "@/features/meetings/components/schedule-week-nav";
import type { MeetingSchedulePageData } from "@/features/meetings/lib/meeting-page";

export function MeetingScheduleContent({
  data,
  canEdit,
  weekStartIso,
  availableWeeks,
}: {
  data: MeetingSchedulePageData;
  canEdit: boolean;
  weekStartIso: string;
  availableWeeks: { title: string; date: string }[];
}) {
  const { weekEntry, scheduleRow, savedCount } = data;

  if (!weekEntry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Semana sem apostila</CardTitle>
          <CardDescription>
            Nenhuma apostila importada cobre a semana atual. Importe o conteúdo das reuniões para
            gerar a programação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/designacoes/reunioes/conteudo">Importar conteúdo</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const midweekTable = (
    <MeetingScheduleTable
      title="Meio de Semana"
      day={scheduleRow?.midweekDay ?? null}
      time={scheduleRow?.midweekTime ?? null}
      fallbackTime="19:30"
      sections={data.midweekSections}
      assignments={data.assignedNames}
    />
  );

  const weekendTable = (
    <MeetingScheduleTable
      title="Fim de Semana"
      day={scheduleRow?.weekendDay ?? null}
      time={scheduleRow?.weekendTime ?? null}
      fallbackTime="09:30"
      sections={data.weekendSections}
      assignments={data.assignedNames}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Semana de {weekEntry.week.week}</Badge>
        {(!scheduleRow?.midweekTime || !scheduleRow?.weekendTime) && (
          <Badge variant="outline">Horário padrão em uso</Badge>
        )}
        {savedCount > 0 && <Badge variant="outline">Programação salva</Badge>}
        {canEdit && (
          <Button variant="outline" size="sm" className="ml-auto" asChild>
            <Link href="/dashboard/designacoes/reunioes/programar">
              <CalendarCog aria-hidden="true" />
              Programar reunião
            </Link>
          </Button>
        )}
      </div>

      <ScheduleWeekNav weekStartIso={weekStartIso} weeks={availableWeeks} />

      <MeetingTabs midweek={midweekTable} weekend={weekendTable} />
    </div>
  );
}
