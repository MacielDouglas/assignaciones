import { describe, expect, it } from "bun:test";
import type { SchedulePerson } from "@/features/meetings/lib/meeting-builder";
import {
  classifyMinistryPart,
  isMinistryDemonstration,
} from "@/features/meetings/lib/meeting-builder";
import {
  compareCandidates,
  helperMatchesStudent,
  personMatchesRule,
  SLOT_RULES,
  timeSinceAssignment,
} from "@/features/meetings/lib/schedule-rules";

function makePerson(overrides: Partial<SchedulePerson> = {}): SchedulePerson {
  return {
    id: "p1",
    nome: "João Silva",
    ativo: true,
    estudante: true,
    batizado: true,
    sexo: "MALE",
    familiaId: "f1",
    privilegiosServico: true,
    anciao: false,
    oQueVoceDiria: false,
    presidenteNossaVida: false,
    discursoTesouros: false,
    joiasEspirituais: false,
    leituraBiblia: true,
    partesNossaVidaCrista: false,
    estudoBiblicoCongregacao: false,
    leitorEstudoBiblico: false,
    oracao: false,
    presidenteReuniaoPublica: false,
    discursoPublico: false,
    dirigenteEstudoSentinela: false,
    leitorEstudoSentinela: false,
    ...overrides,
  };
}

describe("personMatchesRule", () => {
  it("rejeita mulher em parte destinada a homens", () => {
    const result = personMatchesRule(makePerson({ sexo: "FEMALE" }), SLOT_RULES.discursoTesouros);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("homens");
  });

  it("exige habilitação específica da parte", () => {
    const result = personMatchesRule(makePerson(), SLOT_RULES.discursoTesouros);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("habilitação");
  });

  it("aceita pessoa qualificada", () => {
    const person = makePerson({ discursoTesouros: true });
    const result = personMatchesRule(person, SLOT_RULES.discursoTesouros);
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeNull();
  });

  it("exige estudante para a leitura da Bíblia", () => {
    const result = personMatchesRule(makePerson({ estudante: false }), SLOT_RULES.leituraBiblia);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("estudante");
  });

  it("necessidades locais aceita apenas anciãos", () => {
    expect(personMatchesRule(makePerson({ anciao: false }), SLOT_RULES.necessidadesLocais)).toEqual(
      {
        eligible: false,
        reason: "Apenas anciãos.",
      },
    );
    expect(
      personMatchesRule(makePerson({ anciao: true }), SLOT_RULES.necessidadesLocais).eligible,
    ).toBe(true);
  });

  it("'O que você diria?' exige masculino + batizado + habilidade", () => {
    const rule = SLOT_RULES.oQueVoceDiria;
    expect(personMatchesRule(makePerson({ sexo: "FEMALE" }), rule).eligible).toBe(false);
    expect(personMatchesRule(makePerson({ batizado: false }), rule).eligible).toBe(false);
    expect(personMatchesRule(makePerson(), rule).eligible).toBe(false);
    expect(personMatchesRule(makePerson({ oQueVoceDiria: true }), rule).eligible).toBe(true);
  });

  it("estudante do ministério não exige sexo nem batismo", () => {
    const female = makePerson({ sexo: "FEMALE", batizado: false });
    expect(personMatchesRule(female, SLOT_RULES.estudanteIniciando).eligible).toBe(true);
  });

  it("rejeita pessoa inativa", () => {
    const result = personMatchesRule(makePerson({ ativo: false }), SLOT_RULES.estudanteIniciando);
    expect(result.eligible).toBe(false);
  });
});

describe("helperMatchesStudent", () => {
  const studentMale = makePerson({ id: "s1", familiaId: "f1" });
  const studentFemale = makePerson({ id: "s2", sexo: "FEMALE", familiaId: "f1" });

  it("aceita ajudante do mesmo sexo", () => {
    const helper = makePerson({ id: "h1", sexo: "MALE", familiaId: "f2" });
    expect(helperMatchesStudent(helper, studentMale).eligible).toBe(true);
  });

  it("aceita ajudante da mesma família mesmo com sexo diferente", () => {
    const helper = makePerson({ id: "h2", sexo: "MALE", familiaId: "f1" });
    const result = helperMatchesStudent(helper, studentFemale);
    expect(result.eligible).toBe(true);
  });

  it("rejeita ajudante de sexo e família diferentes", () => {
    const helper = makePerson({ id: "h3", sexo: "MALE", familiaId: "f2" });
    const result = helperMatchesStudent(helper, studentFemale);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("sexo feminino");
  });

  it("sem estudante designado, aceita qualquer ajudante", () => {
    const helper = makePerson({ id: "h4" });
    expect(helperMatchesStudent(helper, null).eligible).toBe(true);
  });
});

describe("compareCandidates (ORDER BY lastAssignmentDate ASC)", () => {
  const base = { nome: "X" };

  it("prioriza quem tem menos designações recentes", () => {
    const fewer = { ...base, nome: "Ana", recentAssignments: 0, lastAssignmentWeek: "2026-08-17" };
    const more = { ...base, nome: "Bruno", recentAssignments: 3, lastAssignmentWeek: null };
    expect(compareCandidates(fewer, more)).toBeLessThan(0);
  });

  it("empate recente: quem está há mais tempo sem parte vem primeiro", () => {
    const older = { ...base, nome: "Ana", recentAssignments: 1, lastAssignmentWeek: "2026-01-05" };
    const newer = {
      ...base,
      nome: "Bruno",
      recentAssignments: 1,
      lastAssignmentWeek: "2026-08-03",
    };
    expect(compareCandidates(older, newer)).toBeLessThan(0);
  });

  it("quem nunca foi designado aparece primeiro", () => {
    const never = { ...base, nome: "Zeno", recentAssignments: 0, lastAssignmentWeek: null };
    const assigned = {
      ...base,
      nome: "Ana",
      recentAssignments: 0,
      lastAssignmentWeek: "2025-01-06",
    };
    expect(compareCandidates(never, assigned)).toBeLessThan(0);
  });

  it("desempata por nome", () => {
    const ana = { ...base, nome: "Ana", recentAssignments: 0, lastAssignmentWeek: null };
    const bruno = { ...base, nome: "Bruno", recentAssignments: 0, lastAssignmentWeek: null };
    expect(compareCandidates(ana, bruno)).toBeLessThan(0);
  });
});

describe("timeSinceAssignment", () => {
  it("nunca designado", () => {
    expect(timeSinceAssignment(null, "2026-08-17")).toBe("Nunca designado");
  });

  it("designado nesta semana", () => {
    expect(timeSinceAssignment("2026-08-17", "2026-08-17")).toBe("Designado nesta semana");
  });

  it("semanas", () => {
    expect(timeSinceAssignment("2026-08-10", "2026-08-17")).toBe("Há 1 semana");
    expect(timeSinceAssignment("2026-07-20", "2026-08-17")).toBe("Há 4 semanas");
  });

  it("meses", () => {
    expect(timeSinceAssignment("2026-04-06", "2026-08-17")).toBe("Há 4 meses");
  });
});

describe("classifyMinistryPart", () => {
  it("classifica títulos em espanhol", () => {
    expect(classifyMinistryPart({ title: "Iniciemos conversaciones" })).toBe("iniciando");
    expect(classifyMinistryPart({ title: "Cultivemos interés" })).toBe("cultivando");
    expect(classifyMinistryPart({ title: "Hagamos discípulos" })).toBe("fazendo");
    expect(classifyMinistryPart({ title: "¿Qué dirías?" })).toBe("oQueVoceDiria");
    expect(classifyMinistryPart({ title: "Expliquemos lo que creemos" })).toBe("explicando");
  });

  it("classifica títulos em português", () => {
    expect(classifyMinistryPart({ title: "Iniciando conversas" })).toBe("iniciando");
    expect(classifyMinistryPart({ title: "Cultivando interesse" })).toBe("cultivando");
    expect(classifyMinistryPart({ title: "Fazendo discípulos" })).toBe("fazendo");
    expect(classifyMinistryPart({ title: "O que você diria?" })).toBe("oQueVoceDiria");
    expect(classifyMinistryPart({ title: "Explicando suas crenças" })).toBe("explicando");
  });

  it("trata demais partes como discurso", () => {
    expect(classifyMinistryPart({ title: "Presentación de revistas" })).toBe("discurso");
  });
});

describe("isMinistryDemonstration", () => {
  it("detecta demonstração", () => {
    expect(
      isMinistryDemonstration({
        title: "Expliquemos lo que creemos",
        assignment: "Demuestre en una conversación.",
      }),
    ).toBe(true);
  });

  it("discurso tem precedência sobre demonstração", () => {
    expect(
      isMinistryDemonstration({
        title: "Explicando suas crenças",
        assignment: "Discurso de 4 minutos.",
      }),
    ).toBe(false);
  });

  it("sem pistas, não é demonstração", () => {
    expect(isMinistryDemonstration({ title: "Expliquemos lo que creemos" })).toBe(false);
  });
});
