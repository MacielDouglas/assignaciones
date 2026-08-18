import type { Sex } from "@/generated/prisma/enums";

export const STUDENT_FIELDS = [
  "iniciandoConversa",
  "cultivandoInteresse",
  "fazendoDiscipulos",
  "explicandoCrencas",
] as const;

export const MALE_STUDENT_FIELDS = ["discursoFacaseuMelhor", "leituraBiblia"] as const;

export const MALE_BAPTIZED_FIELDS = ["privilegiosServico", "oracao"] as const;

export const PRIVILEGE_FIELDS = [
  "anciao",
  "oQueVoceDiria",
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
] as const;

export interface PersonNormalizable {
  sexo?: Sex;
  jovem?: boolean;
  estudante?: boolean;
  batizado?: boolean;
  casado?: boolean;
  privilegiosServico?: boolean;
  [key: string]: unknown;
}

export function normalizePersonFields<T extends PersonNormalizable>(data: T): T {
  const normalized = { ...data };
  const flags = normalized as Record<string, boolean>;

  const estudante = normalized.estudante !== false;
  const batizado = normalized.batizado === true;
  const sexoMasculino = normalized.sexo === "MALE";
  const privilegiosServico = normalized.privilegiosServico === true;

  if (!estudante) {
    for (const field of STUDENT_FIELDS) flags[field] = false;
  }

  if (!sexoMasculino || !estudante) {
    for (const field of MALE_STUDENT_FIELDS) flags[field] = false;
  }

  if (!sexoMasculino || !batizado) {
    for (const field of MALE_BAPTIZED_FIELDS) flags[field] = false;
  }

  if (!sexoMasculino || !batizado || !privilegiosServico) {
    for (const field of PRIVILEGE_FIELDS) flags[field] = false;
  }

  if (normalized.jovem === true) {
    normalized.casado = false;
  }

  return normalized;
}

export function getFamilyNameFromPersonName(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : nome.trim() || "Família";
}

export interface MarriageCandidate {
  id: string | null;
  sexo: Sex;
  casado: boolean;
  spouseId: string | null;
}

export interface MarriageValidation {
  error: string | null;
  spouseId: string | null;
  linked: boolean;
}

export function resolveMarriage(
  self: { id: string | null; sexo: Sex; casado: boolean; spouseId: string | null },
  familyMembers: MarriageCandidate[],
): MarriageValidation {
  const others = familyMembers.filter((member) => member.id !== self.id);

  if (!self.casado) {
    return { error: null, spouseId: null, linked: false };
  }

  const marriedSameSex = others.filter((member) => member.casado && member.sexo === self.sexo);
  const marriedOppositeSex = others.filter((member) => member.casado && member.sexo !== self.sexo);

  if (marriedSameSex.length > 0) {
    return {
      error: "Não é permitido ter dois casados do mesmo sexo na mesma família.",
      spouseId: null,
      linked: false,
    };
  }

  if (marriedOppositeSex.length > 1) {
    return {
      error: "Só é permitido um casal por família.",
      spouseId: null,
      linked: false,
    };
  }

  if (marriedOppositeSex.length === 1) {
    const candidate = marriedOppositeSex[0];
    if (candidate.spouseId && candidate.spouseId !== self.id) {
      return {
        error: "O cônjuge da família já está vinculado a outra pessoa.",
        spouseId: null,
        linked: false,
      };
    }
    return { error: null, spouseId: candidate.id, linked: true };
  }

  if (self.spouseId) {
    return { error: null, spouseId: null, linked: false };
  }

  return { error: null, spouseId: null, linked: false };
}
