import { Award, ChevronDown, Star } from "lucide-react";
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

/**
 * Cargos ministeriais e privilégios congregacionais da pessoa.
 * Recolhido por padrão para manter o card compacto; o resumo mostra
 * a quantidade de privilégios ativos.
 */
export function PrivilegesSection({ person }: { person: PersonPrivileges }) {
  const active = PRIVILEGE_ORDER.filter((key) => person[key]);
  if (active.length === 0) return null;

  return (
    <details className="group/priv">
      <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase [&::-webkit-details-marker]:hidden">
        <Award className="size-3.5 shrink-0" aria-hidden="true" />
        Privilégios
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] tabular-nums">
          {active.length}
        </Badge>
        <ChevronDown
          className="ml-auto size-3.5 transition-transform duration-200 group-open/priv:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="mt-2 flex flex-wrap gap-1.5">
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
    </details>
  );
}
