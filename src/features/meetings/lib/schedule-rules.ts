import type { AssignmentKind, SchedulePerson } from "@/features/meetings/lib/meeting-builder";

/**
 * Regras de elegibilidade das designações (fonte única de verdade).
 * Módulo puro: usado pelos componentes para exibir candidatos já filtrados
 * e pelo validador server-side (schedule-validation.ts) para rejeitar
 * designações que violem as regras. A aplicação efetiva acontece no backend.
 */
export interface SlotRule {
  /** Sexo masculino obrigatório (gender = male). */
  requiresMale?: boolean;
  /** Precisa ser estudante (role = student). */
  requiresStudent?: boolean;
  /** Precisa ser batizado (baptized = true). */
  requiresBaptized?: boolean;
  /** Precisa ser ancião (role = elder). */
  requiresElder?: boolean;
  /** Habilitação/qualificação obrigatória no registro da pessoa. */
  skill?: SkillField;
  /**
   * Ajudante: precisa cumprir a regra do estudante da mesma parte
   * (mesmo sexo OU membro da mesma família).
   */
  helper?: boolean;
}

export type SkillField =
  | "discursoTesouros"
  | "joiasEspirituais"
  | "leituraBiblia"
  | "oQueVoceDiria"
  | "partesNossaVidaCrista"
  | "estudoBiblicoCongregacao"
  | "leitorEstudoBiblico"
  | "oracao"
  | "presidenteNossaVida"
  | "presidenteReuniaoPublica"
  | "discursoPublico"
  | "dirigenteEstudoSentinela"
  | "leitorEstudoSentinela";

export const SLOT_RULES: Record<AssignmentKind, SlotRule> = {
  presidente: { requiresMale: true, skill: "presidenteNossaVida" },
  discursoTesouros: { requiresMale: true, skill: "discursoTesouros" },
  joiasEspirituais: { requiresMale: true, skill: "joiasEspirituais" },
  leituraBiblia: { requiresMale: true, requiresStudent: true, skill: "leituraBiblia" },
  discursoMinisterio: {
    requiresMale: true,
    requiresStudent: true,
  },
  estudanteIniciando: { requiresStudent: true },
  ajudanteIniciando: { requiresStudent: true, helper: true },
  estudanteCultivando: { requiresStudent: true },
  ajudanteCultivando: { requiresStudent: true, helper: true },
  estudanteFazendo: { requiresStudent: true },
  ajudanteFazendo: { requiresStudent: true, helper: true },
  oQueVoceDiria: { requiresMale: true, requiresBaptized: true, skill: "oQueVoceDiria" },
  estudanteExplicandoDiscurso: { requiresMale: true, requiresStudent: true },
  estudanteExplicandoDemonstracao: { requiresStudent: true },
  ajudanteExplicandoDemonstracao: { requiresStudent: true, helper: true },
  partesNossaVidaCrista: { skill: "partesNossaVidaCrista" },
  necessidadesLocais: { requiresElder: true },
  dirigenteEstudoBiblico: { skill: "estudoBiblicoCongregacao" },
  leitorEstudoBiblico: { skill: "leitorEstudoBiblico" },
  oracao: { requiresMale: true, skill: "oracao" },
  presidenteReuniaoPublica: { requiresMale: true, skill: "presidenteReuniaoPublica" },
  discursoPublico: { requiresMale: true, skill: "discursoPublico" },
  dirigenteSentinela: { requiresMale: true, skill: "dirigenteEstudoSentinela" },
  leitorSentinela: { requiresMale: true, skill: "leitorEstudoSentinela" },
};

/** Lista dos kinds válidos (usada na validação zod do payload). */
export const ASSIGNMENT_KINDS = Object.keys(SLOT_RULES) as AssignmentKind[];

function skillValue(person: SchedulePerson, skill: SkillField | undefined): boolean {
  if (!skill) return true;
  return Boolean(person[skill]);
}

/** Verifica se a pessoa cumpre os requisitos básicos do tipo de designação. */
export function personMatchesRule(
  person: SchedulePerson,
  rule: SlotRule,
): { eligible: boolean; reason: string | null } {
  if (!person.ativo) return { eligible: false, reason: "Pessoa inativa." };
  if (rule.requiresMale && person.sexo !== "MALE") {
    return { eligible: false, reason: "Parte destinada a homens." };
  }
  if (rule.requiresStudent && !person.estudante) {
    return { eligible: false, reason: "Precisa ser estudante." };
  }
  if (rule.requiresBaptized && !person.batizado) {
    return { eligible: false, reason: "Precisa ser batizado(a)." };
  }
  if (rule.requiresElder && !person.anciao) {
    return { eligible: false, reason: "Apenas anciãos." };
  }
  if (!skillValue(person, rule.skill)) {
    return { eligible: false, reason: "Sem habilitação para esta parte." };
  }
  return { eligible: true, reason: null };
}

/**
 * Ajudante deve ser do mesmo sexo do estudante OU membro da mesma família.
 * `student` é a pessoa designada como estudante na mesma parte.
 */
export function helperMatchesStudent(
  helper: SchedulePerson,
  student: SchedulePerson | null,
): { eligible: boolean; reason: string | null } {
  if (!student) return { eligible: true, reason: null };
  const sameSex = helper.sexo === student.sexo;
  const sameFamily = helper.familiaId === student.familiaId;
  if (sameSex || sameFamily) return { eligible: true, reason: null };
  return {
    eligible: false,
    reason:
      student.sexo === "FEMALE"
        ? "Ajudante precisa ser do sexo feminino ou da mesma família."
        : "Ajudante precisa ser do sexo masculino ou da mesma família.",
  };
}

export interface CandidateMetrics {
  /** Semana ISO da designação mais recente (null se nunca foi designado). */
  lastAssignmentWeek: string | null;
  /** Quantidade de designações nos últimos 60 dias. */
  recentAssignments: number;
}

/**
 * Ordenação por prioridade:
 * 1º menos designações recentes; 2º há mais tempo sem receber parte
 * (ORDER BY lastAssignmentDate ASC; quem nunca foi designado vem primeiro).
 */
export function compareCandidates(
  a: CandidateMetrics & { nome: string },
  b: CandidateMetrics & { nome: string },
): number {
  if (a.recentAssignments !== b.recentAssignments) {
    return a.recentAssignments - b.recentAssignments;
  }
  const aLast = a.lastAssignmentWeek ?? "";
  const bLast = b.lastAssignmentWeek ?? "";
  if (aLast !== bLast) {
    // String vazia (nunca designado) ordena antes: asc com nulls first.
    if (!aLast) return -1;
    if (!bLast) return 1;
    return aLast < bLast ? -1 : 1;
  }
  return a.nome.localeCompare(b.nome, "pt-BR");
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Rótulo amigável do tempo desde a última designação. */
export function timeSinceAssignment(
  lastAssignmentWeek: string | null,
  weekStartIso: string,
): string {
  if (!lastAssignmentWeek) return "Nunca designado";
  const diffWeeks = Math.max(
    0,
    Math.round(
      (Date.parse(`${weekStartIso}T00:00:00Z`) - Date.parse(`${lastAssignmentWeek}T00:00:00Z`)) /
        MS_PER_WEEK,
    ),
  );
  if (diffWeeks <= 0) return "Designado nesta semana";
  if (diffWeeks === 1) return "Há 1 semana";
  if (diffWeeks < 5) return `Há ${diffWeeks} semanas`;
  const months = Math.floor(diffWeeks / 4.345);
  if (months <= 1) return "Há cerca de 1 mês";
  return `Há ${months} meses`;
}
