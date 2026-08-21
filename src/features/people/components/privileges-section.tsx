import { Award, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRIVILEGE_LABEL } from "../lib/person-labels";

export interface PersonPrivileges {
  anciao: boolean;
  oQueVoceDiria: boolean;
  presidenteNossaVida: boolean;
  discursoTesouros: boolean;
  joiasEspirituais: boolean;
  partesNossaVidaCrista: boolean;
  estudoBiblicoCongregacao: boolean;
  leitorEstudoBiblico: boolean;
  presidenteReuniaoPublica: boolean;
  discursoPublico: boolean;
  dirigenteEstudoSentinela: boolean;
  leitorEstudoSentinela: boolean;
  privilegiosServico: boolean;
  leituraBiblia: boolean;
}

const PRIVILEGE_ORDER: (keyof PersonPrivileges)[] = [
  "anciao",
  "privilegiosServico",
  "presidenteNossaVida",
  "discursoTesouros",
  "joiasEspirituais",
  "partesNossaVidaCrista",
  "estudoBiblicoCongregacao",
  "leitorEstudoBiblico",
  "presidenteReuniaoPublica",
  "discursoPublico",
  "dirigenteEstudoSentinela",
  "leitorEstudoSentinela",
  "leituraBiblia",
];

/** Cargos ministeriais e privilégios congregacionais da pessoa. */
export function PrivilegesSection({ person }: { person: PersonPrivileges }) {
  const active = PRIVILEGE_ORDER.filter((key) => person[key]);
  if (active.length === 0) return null;

  return (
    <section aria-label="Privilégios congregacionais" className="space-y-1.5">
      <p className="text-muted-foreground flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase">
        <Award className="size-3.5" aria-hidden="true" />
        Privilégios
      </p>
      <div className="flex flex-wrap gap-1.5">
        {active.map((key) => (
          <Badge
            key={key}
            variant="secondary"
            className={cn(
              "px-2 py-0 text-[11px] font-medium",
              key === "anciao" &&
                "border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-orange-500/5 text-amber-700 dark:text-amber-400",
            )}
          >
            {key === "anciao" && <Star className="mr-1 size-3 fill-current" aria-hidden="true" />}
            {PRIVILEGE_LABEL[key]}
          </Badge>
        ))}
      </div>
    </section>
  );
}
