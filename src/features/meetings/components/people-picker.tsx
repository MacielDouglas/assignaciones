"use client";

import { Check, ChevronDown, Search, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CandidatePerson } from "@/features/meetings/lib/candidates";
import type { AssignmentKind } from "@/features/meetings/lib/meeting-builder";
import {
  helperMatchesStudent,
  personMatchesRule,
  type SkillField,
  SLOT_RULES,
  timeSinceAssignment,
} from "@/features/meetings/lib/schedule-rules";
import { cn } from "@/lib/utils";

function initials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : nome.slice(0, 2);
}

function hueFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Badges de qualificação exibidos nos candidatos (máx. 3). */
function qualificationBadges(person: CandidatePerson, skill: SkillField | undefined): string[] {
  const badges: string[] = [];
  if (person.estudante) badges.push("Estudante");
  if (person.batizado) badges.push("Batizado(a)");
  if (person.anciao) badges.push("Ancião");
  if (skill && person[skill] && !badges.includes(SKILL_BADGE_LABELS[skill])) {
    badges.push(SKILL_BADGE_LABELS[skill]);
  }
  return badges.slice(0, 3);
}

const SKILL_BADGE_LABELS: Record<SkillField, string> = {
  discursoTesouros: "Tesouros",
  joiasEspirituais: "Joias",
  leituraBiblia: "Leitura",
  oQueVoceDiria: "O que diria",
  partesNossaVidaCrista: "NVC",
  estudoBiblicoCongregacao: "Dirigente EBC",
  leitorEstudoBiblico: "Leitor EBC",
  oracao: "Oração",
  presidenteNossaVida: "Presidente NVC",
  presidenteReuniaoPublica: "Pres. pública",
  discursoPublico: "Discurso público",
  dirigenteEstudoSentinela: "Dirigente Sentinela",
  leitorEstudoSentinela: "Leitor Sentinela",
};

export function PersonAvatar({
  person,
  className,
}: {
  person: { id: string; nome: string };
  className?: string;
}) {
  return (
    <Avatar className={cn("size-7", className)}>
      <AvatarFallback
        style={{ backgroundColor: `hsl(${hueFromId(person.id)} 42% 46%)` }}
        className="text-[11px] font-semibold text-white"
      >
        {initials(person.nome)}
      </AvatarFallback>
    </Avatar>
  );
}

interface PickerCandidate {
  person: CandidatePerson;
  reason: string | null;
}

function useSlotCandidates(
  kind: AssignmentKind,
  roster: CandidatePerson[],
  student: CandidatePerson | null,
) {
  return useMemo(() => {
    const rule = SLOT_RULES[kind];
    const eligible: CandidatePerson[] = [];
    const others: PickerCandidate[] = [];
    for (const person of roster) {
      const base = personMatchesRule(person, rule);
      const helperCheck =
        base.eligible && rule.helper ? helperMatchesStudent(person, student) : null;
      if (base.eligible && !rule.helper) eligible.push(person);
      else if (base.eligible && helperCheck?.eligible) eligible.push(person);
      else others.push({ person, reason: helperCheck?.reason ?? base.reason ?? "Inelegível." });
    }
    return { rule, eligible, others };
  }, [kind, roster, student]);
}

export function PeoplePicker({
  kind,
  roster,
  value,
  student = null,
  disabled,
  weekStartIso,
  label,
  onSelect,
}: {
  kind: AssignmentKind;
  roster: CandidatePerson[];
  value: string;
  student?: CandidatePerson | null;
  disabled?: boolean;
  weekStartIso: string;
  label: string;
  onSelect: (personId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { rule, eligible, others } = useSlotCandidates(kind, roster, student);
  const selected = roster.find((person) => person.id === value) ?? null;

  const selectedEligibility = selected
    ? (() => {
        const base = personMatchesRule(selected, rule);
        if (!base.eligible) return false;
        if (rule.helper && !helperMatchesStudent(selected, student).eligible) return false;
        return true;
      })()
    : true;

  const normalizedQuery = normalize(query);
  const match = (person: CandidatePerson) =>
    normalizedQuery.length === 0 ||
    normalize(person.nome).includes(normalizedQuery) ||
    normalize(person.familiaNome ?? "").includes(normalizedQuery);

  const filteredEligible = eligible.filter(match);
  const filteredOthers = others.filter(({ person }) => match(person));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`${label}${selected ? `: ${selected.nome}` : ""}`}
          disabled={disabled}
          className={cn(
            "h-auto min-h-10 w-full justify-between gap-2 px-2.5 py-1.5 font-normal",
            !selected && "text-muted-foreground",
            selected && !selectedEligibility && "border-warning/60",
          )}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <PersonAvatar person={selected} />
              <span className="min-w-0 truncate text-sm font-medium">{selected.nome}</span>
            </span>
          ) : (
            <span className="truncate text-sm">
              {eligible.length === 0 ? "Ninguém habilitado" : "Selecionar…"}
            </span>
          )}
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar publicador…"
              autoComplete="off"
              className="h-9 w-full rounded-lg border bg-card pl-8 pr-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              aria-label="Buscar publicador"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          {eligible.length === 0 && (
            <p className="flex items-start gap-2 px-2 py-2 text-xs text-warning">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Não existem publicadores qualificados para esta parte.
            </p>
          )}

          {filteredEligible.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => {
                onSelect(person.id === value ? "" : person.id);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent"
            >
              <PersonAvatar person={person} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{person.nome}</span>
                <span className="text-muted-foreground block truncate text-xs">
                  {timeSinceAssignment(person.lastAssignmentWeek, weekStartIso)}
                  {person.familiaNome ? ` · Família ${person.familiaNome}` : ""}
                </span>
                <span className="mt-0.5 flex flex-wrap gap-1">
                  {qualificationBadges(person, rule.skill).map((badge) => (
                    <Badge
                      key={badge}
                      variant="outline"
                      className="text-muted-foreground px-1.5 py-0 text-[10px]"
                    >
                      {badge}
                    </Badge>
                  ))}
                </span>
              </span>
              {person.id === value && <Check className="size-4 shrink-0" aria-hidden="true" />}
            </button>
          ))}

          {filteredOthers.length > 0 && (
            <>
              <p className="text-muted-foreground mt-1 px-2 py-1 text-[11px] font-semibold tracking-wide uppercase">
                Sem habilitação para esta parte
              </p>
              {filteredOthers.slice(0, 6).map(({ person, reason }) => (
                <div
                  key={person.id}
                  title={reason ?? undefined}
                  className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2 py-1.5 opacity-55"
                  aria-disabled="true"
                >
                  <PersonAvatar person={person} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{person.nome}</span>
                    <span className="text-muted-foreground block truncate text-xs">{reason}</span>
                  </span>
                </div>
              ))}
            </>
          )}

          {filteredEligible.length === 0 && filteredOthers.length === 0 && (
            <p className="text-muted-foreground px-2 py-3 text-center text-xs">
              Nenhum publicador encontrado.
            </p>
          )}
        </div>

        <div className="border-t px-3 py-2">
          <Badge variant="secondary" className="text-[11px]">
            Ordem por prioridade de designação
          </Badge>
        </div>
      </PopoverContent>
    </Popover>
  );
}
