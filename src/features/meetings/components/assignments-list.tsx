import { CalendarCog } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MeetingSection } from "@/features/meetings/lib/meeting-builder";

export function AssignmentsList({
  midweekSections,
  weekendSections,
  assignedNames,
  canEdit,
}: {
  midweekSections: MeetingSection[];
  weekendSections: MeetingSection[];
  assignedNames: Record<string, string>;
  canEdit: boolean;
}) {
  const assignedCount = Object.keys(assignedNames).length;

  if (assignedCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhuma designação salva</CardTitle>
          <CardDescription>
            Nenhuma designação foi salva para a semana atual. Programe as reuniões para atribuir as
            partes.
          </CardDescription>
        </CardHeader>
        {canEdit && (
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/designacoes/reunioes/programar">
                <CalendarCog aria-hidden="true" />
                Programar reunião
              </Link>
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  const renderSections = (title: string, sections: MeetingSection[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sections.map((section) => {
          const parts = section.parts.filter((part) =>
            part.slots.some((slot) => assignedNames[slot.id]),
          );
          if (parts.length === 0) return null;
          return (
            <div key={section.id} className="border-t px-4 py-2.5 first:border-t-0 sm:px-6">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {section.title}
                </h3>
                {section.subtitle && (
                  <span className="text-muted-foreground text-xs">{section.subtitle}</span>
                )}
              </div>
              <div className="divide-y">
                {parts.map((part) => {
                  const assignedSlots = part.slots.filter((slot) => assignedNames[slot.id]);
                  if (assignedSlots.length === 0) return null;
                  return (
                    <div
                      key={part.id}
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-1"
                    >
                      <span className="text-muted-foreground w-9 shrink-0 text-xs tabular-nums">
                        {part.time ?? ""}
                      </span>
                      <p className="min-w-0 text-sm leading-snug font-medium">{part.title}</p>
                      {assignedSlots.map((slot) => (
                        <span
                          key={slot.id}
                          className="bg-muted/60 rounded-md border px-1.5 py-0.5 text-[11px] leading-tight"
                        >
                          <span className="text-muted-foreground">{slot.label}</span>{" "}
                          <span className="font-semibold">{assignedNames[slot.id]}</span>
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderSections("Reunião do Meio de Semana", midweekSections)}
      {weekendSections.some((section) =>
        section.parts.some((part) => part.slots.some((slot) => assignedNames[slot.id])),
      ) && renderSections("Reunião do Fim de Semana", weekendSections)}
    </div>
  );
}
