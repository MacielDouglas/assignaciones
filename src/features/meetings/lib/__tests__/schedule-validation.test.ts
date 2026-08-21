import { describe, expect, it, mock } from "bun:test";
import type { CandidatePerson } from "@/features/meetings/lib/candidates";
import type { ScheduledMeetingInput } from "@/features/meetings/schemas";

// O validador importa a cadeia de módulos que termina no Prisma Client;
// o mock evita exigir DATABASE_URL nos testes.
mock.module("@/lib/prisma", () => ({ prisma: {} }));

const { validateScheduledAssignments } = await import(
  "@/features/meetings/lib/schedule-validation"
);

function makeRosterPerson(overrides: Partial<CandidatePerson> = {}): CandidatePerson {
  return {
    id: "p1",
    nome: "João Silva",
    ativo: true,
    estudante: true,
    batizado: true,
    sexo: "MALE",
    familiaId: "f1",
    lastAssignmentWeek: null,
    recentAssignments: 0,
    familiaNome: "Silva",
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

function makeInput(
  assignments: ScheduledMeetingInput["assignments"],
  meetingType: "MIDWEEK" | "WEEKEND" = "MIDWEEK",
): ScheduledMeetingInput {
  return {
    weekStart: "2026-08-17",
    meetingType,
    middleSong: null,
    openingSong: null,
    closingSong: null,
    talkNumber: null,
    articleId: null,
    assignments,
  };
}

describe("validateScheduledAssignments", () => {
  it("aprova designações válidas sem erros nem avisos", async () => {
    const roster = [
      makeRosterPerson({ id: "a1", nome: "Ana Presidente", presidenteNossaVida: true }),
      makeRosterPerson({ id: "o1", nome: "Carlos Oração", oracao: true }),
    ];
    const result = await validateScheduledAssignments(
      "org1",
      makeInput([
        {
          partId: "initial-president-slot",
          label: "Presidente",
          personId: "a1",
          kind: "presidente",
        },
        { partId: "final-closing-prayer", label: "Oração", personId: "o1", kind: "oracao" },
      ]),
      { roster, siblingAssignments: [] },
    );
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("rejeita mulher em parte exclusiva de homens", async () => {
    const roster = [makeRosterPerson({ id: "f1p", nome: "Marta", sexo: "FEMALE" })];
    const result = await validateScheduledAssignments(
      "org1",
      makeInput([
        {
          partId: "treasures-discourse-slot",
          label: "Designado",
          personId: "f1p",
          kind: "discursoTesouros",
        },
      ]),
      { roster, siblingAssignments: [] },
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Marta");
    expect(result.errors[0].message).toContain("homens");
  });

  it("rejeita pessoa sem habilitação para a parte", async () => {
    const roster = [makeRosterPerson({ id: "s1", nome: "Sem Joias", joiasEspirituais: false })];
    const result = await validateScheduledAssignments(
      "org1",
      makeInput([
        {
          partId: "treasures-jewels-slot",
          label: "Designado",
          personId: "s1",
          kind: "joiasEspirituais",
        },
      ]),
      { roster, siblingAssignments: [] },
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("habilitação");
  });

  it("rejeita ajudante de sexo e família diferentes do estudante", async () => {
    const roster = [
      makeRosterPerson({ id: "st1", nome: "Pedro", sexo: "MALE", familiaId: "fA" }),
      makeRosterPerson({ id: "hj1", nome: "Maria", sexo: "FEMALE", familiaId: "fB" }),
    ];
    const result = await validateScheduledAssignments(
      "org1",
      makeInput([
        {
          partId: "ministry-1-student",
          label: "Estudante",
          personId: "st1",
          kind: "estudanteIniciando",
        },
        {
          partId: "ministry-1-helper",
          label: "Ajudante",
          personId: "hj1",
          kind: "ajudanteIniciando",
        },
      ]),
      { roster, siblingAssignments: [] },
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("sexo masculino");
  });

  it("aceita ajudante da mesma família com sexo diferente", async () => {
    const roster = [
      makeRosterPerson({ id: "st2", nome: "Pedro", sexo: "MALE", familiaId: "fA" }),
      makeRosterPerson({ id: "hj2", nome: "Maria", sexo: "FEMALE", familiaId: "fA" }),
    ];
    const result = await validateScheduledAssignments(
      "org1",
      makeInput([
        {
          partId: "ministry-1-student",
          label: "Estudante",
          personId: "st2",
          kind: "estudanteCultivando",
        },
        {
          partId: "ministry-1-helper",
          label: "Ajudante",
          personId: "hj2",
          kind: "ajudanteCultivando",
        },
      ]),
      { roster, siblingAssignments: [] },
    );
    expect(result.errors).toHaveLength(0);
  });

  it("avisa quando a mesma pessoa tem duas partes na mesma reunião", async () => {
    const roster = [
      makeRosterPerson({
        id: "dup",
        nome: "Rafael",
        discursoTesouros: true,
        joiasEspirituais: true,
      }),
    ];
    const result = await validateScheduledAssignments(
      "org1",
      makeInput([
        {
          partId: "treasures-discourse-slot",
          label: "Designado",
          personId: "dup",
          kind: "discursoTesouros",
        },
        {
          partId: "treasures-jewels-slot",
          label: "Designado",
          personId: "dup",
          kind: "joiasEspirituais",
        },
      ]),
      { roster, siblingAssignments: [] },
    );
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toBe("Rafael já possui outra designação nesta reunião.");
  });

  it("avisa quando a pessoa também está designada na outra reunião da semana", async () => {
    const roster = [makeRosterPerson({ id: "cross", nome: "Tiago", discursoPublico: true })];
    const result = await validateScheduledAssignments(
      "org1",
      makeInput(
        [
          {
            partId: "weekend-talk-slot",
            label: "Designado",
            personId: "cross",
            kind: "discursoPublico",
          },
        ],
        "WEEKEND",
      ),
      { roster, siblingAssignments: ["cross"] },
    );
    expect(result.warnings.some((warning) => warning.message.includes("meio de semana"))).toBe(
      true,
    );
  });

  it("rejeita pessoa inexistente ou inativa", async () => {
    const result = await validateScheduledAssignments(
      "org1",
      makeInput([
        {
          partId: "initial-president-slot",
          label: "Presidente",
          personId: "ghost",
          kind: "presidente",
        },
      ]),
      { roster: [], siblingAssignments: [] },
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("não encontrada");
  });
});
