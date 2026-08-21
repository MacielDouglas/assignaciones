import type { SchedulePerson } from "@/features/meetings/lib/meeting-builder";
import { isoDay, weekStartUtc } from "@/features/meetings/lib/meeting-builder";
import { type CandidateMetrics, compareCandidates } from "@/features/meetings/lib/schedule-rules";
import { prisma } from "@/lib/prisma";

export interface CandidatePerson extends SchedulePerson, CandidateMetrics {
  /** Nome da família, para exibição nos candidatos. */
  familiaNome: string | null;
}

const RECENT_WINDOW_DAYS = 60;

/**
 * Monta a lista de publicadores elegíveis com as métricas de prioridade
 * calculadas no servidor: última designação (campo denormalizado mantido pelo
 * serviço de programação) e quantidade de designações recentes.
 * A ordenação segue ORDER BY lastAssignmentDate ASC (quem está há mais
 * tempo sem parte aparece primeiro).
 */
export async function getScheduleRoster(organizationId: string): Promise<CandidatePerson[]> {
  const nowIso = isoDay(weekStartUtc(new Date()));
  const nowMs = Date.parse(`${nowIso}T00:00:00Z`);
  const recentThreshold = new Date(nowMs - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [persons, meetings] = await Promise.all([
    prisma.person.findMany({
      where: { organizationId, ativo: true },
      select: {
        id: true,
        nome: true,
        sexo: true,
        familiaId: true,
        estudante: true,
        batizado: true,
        ativo: true,
        lastAssignmentDate: true,
        privilegiosServico: true,
        presidenteNossaVida: true,
        discursoTesouros: true,
        joiasEspirituais: true,
        leituraBiblia: true,
        partesNossaVidaCrista: true,
        estudoBiblicoCongregacao: true,
        leitorEstudoBiblico: true,
        oracao: true,
        presidenteReuniaoPublica: true,
        discursoPublico: true,
        dirigenteEstudoSentinela: true,
        leitorEstudoSentinela: true,
        anciao: true,
        oQueVoceDiria: true,
        familia: { select: { name: true } },
      },
      orderBy: { nome: "asc" },
    }),
    // Janela curta apenas para a contagem de designações recentes.
    prisma.scheduledMeeting.findMany({
      where: {
        organizationId,
        weekStart: { lte: new Date(nowMs), gte: recentThreshold },
      },
      select: { assignments: { select: { personId: true } } },
    }),
  ]);

  const recentCounts = new Map<string, number>();
  for (const meeting of meetings) {
    for (const assignment of meeting.assignments) {
      recentCounts.set(assignment.personId, (recentCounts.get(assignment.personId) ?? 0) + 1);
    }
  }

  return persons
    .map((person) => ({
      id: person.id,
      nome: person.nome,
      ativo: person.ativo,
      estudante: person.estudante,
      batizado: person.batizado,
      sexo: person.sexo,
      familiaId: person.familiaId,
      privilegiosServico: person.privilegiosServico,
      anciao: person.anciao,
      oQueVoceDiria: person.oQueVoceDiria,
      presidenteNossaVida: person.presidenteNossaVida,
      discursoTesouros: person.discursoTesouros,
      joiasEspirituais: person.joiasEspirituais,
      leituraBiblia: person.leituraBiblia,
      partesNossaVidaCrista: person.partesNossaVidaCrista,
      estudoBiblicoCongregacao: person.estudoBiblicoCongregacao,
      leitorEstudoBiblico: person.leitorEstudoBiblico,
      oracao: person.oracao,
      presidenteReuniaoPublica: person.presidenteReuniaoPublica,
      discursoPublico: person.discursoPublico,
      dirigenteEstudoSentinela: person.dirigenteEstudoSentinela,
      leitorEstudoSentinela: person.leitorEstudoSentinela,
      familiaNome: person.familia?.name ?? null,
      lastAssignmentWeek: person.lastAssignmentDate ? isoDay(person.lastAssignmentDate) : null,
      recentAssignments: recentCounts.get(person.id) ?? 0,
    }))
    .sort(compareCandidates);
}
