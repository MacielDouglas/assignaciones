import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface PersonQualifications {
  estudante: boolean;
  batizado: boolean;
  jovem: boolean;
  casado: boolean;
}

const QUALIFICATION_LABELS: Record<keyof PersonQualifications, string> = {
  estudante: "Estudante",
  batizado: "Batizado(a)",
  jovem: "Jovem",
  casado: "Casado(a)",
};

/** Qualificações da pessoa (badges). Oculto quando nenhuma se aplica. */
export function QualificationsSection({ person }: { person: PersonQualifications }) {
  const active = (Object.keys(QUALIFICATION_LABELS) as (keyof PersonQualifications)[]).filter(
    (key) => person[key],
  );
  if (active.length === 0) return null;

  return (
    <section aria-label="Qualificações" className="flex flex-wrap items-center gap-1.5">
      <GraduationCap className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
      {active.map((key) => (
        <Badge key={key} variant="outline" className="px-2 py-0 text-[11px] font-medium">
          {QUALIFICATION_LABELS[key]}
        </Badge>
      ))}
    </section>
  );
}
