import type { CandidatePerson } from "@/features/meetings/lib/candidates";
import { getScheduleRoster } from "@/features/meetings/lib/candidates";
import { parseIsoDay } from "@/features/meetings/lib/meeting-builder";
import {
  helperMatchesStudent,
  personMatchesRule,
  SLOT_RULES,
} from "@/features/meetings/lib/schedule-rules";
import type { ScheduledMeetingInput } from "@/features/meetings/schemas";
import type { MeetingType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export interface ScheduleIssue {
  /** null = alerta global da programação. */
  partId: string | null;
  slotId: string | null;
  level: "error" | "warning";
  message: string;
}

export interface ScheduleValidationResult {
  errors: ScheduleIssue[];
  warnings: ScheduleIssue[];
}

/** Dependências injetáveis (facilita os testes automatizados). */
export interface ScheduleValidationDeps {
  roster?: CandidatePerson[];
  /** personIds designados na outra reunião da mesma semana. */
  siblingAssignments?: string[];
}

interface IncomingAssignment {
  partId: string;
  slotId: string;
  kind: keyof typeof SLOT_RULES;
  personId: string;
}

function basePartId(slotId: string): string {
  return slotId.replace(/-(student|helper|slot|speaker|director|reader|prayer)$/i, "");
}

function meetingTypeLabel(meetingType: MeetingType): string {
  return meetingType === "MIDWEEK" ? "meio de semana" : "fim de semana";
}

async function listSiblingAssignments(
  organizationId: string,
  weekStartIso: string,
  meetingType: MeetingType,
): Promise<string[]> {
  const siblingType: MeetingType = meetingType === "MIDWEEK" ? "WEEKEND" : "MIDWEEK";
  const row = await prisma.scheduledMeeting.findUnique({
    where: {
      organizationId_weekStart_meetingType: {
        organizationId,
        weekStart: parseIsoDay(weekStartIso),
        meetingType: siblingType,
      },
    },
    select: { assignments: { select: { personId: true } } },
  });
  return row?.assignments.map((assignment) => assignment.personId) ?? [];
}

/**
 * Validação completa das designações no servidor. A interface consome
 * apenas o resultado; nenhuma regra é aplicada somente no cliente.
 *
 * Regras aplicadas:
 * - Elegibilidade por tipo de parte (sexo, estudante, batizado, ancião, habilidade).
 * - Ajudante: mesmo sexo do estudante OU membro da mesma família.
 * - Pessoa precisa existir e estar ativa na organização.
 * - Aviso quando a pessoa tem mais de uma designação na mesma reunião.
 * - Aviso quando a pessoa também está designada na outra reunião da mesma semana.
 */
export async function validateScheduledAssignments(
  organizationId: string,
  input: ScheduledMeetingInput,
  deps?: ScheduleValidationDeps,
): Promise<ScheduleValidationResult> {
  const errors: ScheduleIssue[] = [];
  const warnings: ScheduleIssue[] = [];

  const [roster, siblingPersonIds] = await Promise.all([
    deps?.roster ?? getScheduleRoster(organizationId),
    deps?.siblingAssignments ??
      listSiblingAssignments(organizationId, input.weekStart, input.meetingType),
  ]);
  const byId = new Map<string, CandidatePerson>(roster.map((person) => [person.id, person]));

  const incoming: IncomingAssignment[] = input.assignments.map((assignment) => ({
    partId: assignment.partId,
    slotId: assignment.partId,
    kind: assignment.kind as keyof typeof SLOT_RULES,
    personId: assignment.personId,
  }));

  // 1) Existência + elegibilidade básica (inclui ajudantes).
  for (const assignment of incoming) {
    const person = byId.get(assignment.personId);
    if (!person) {
      errors.push({
        partId: assignment.partId,
        slotId: assignment.slotId,
        level: "error",
        message: "Pessoa não encontrada ou inativa nesta organização.",
      });
      continue;
    }
    const rule = SLOT_RULES[assignment.kind];
    if (!rule) continue;
    const check = personMatchesRule(person, rule);
    if (!check.eligible) {
      errors.push({
        partId: assignment.partId,
        slotId: assignment.slotId,
        level: "error",
        message: `${person.nome}: ${check.reason}`,
      });
    }
  }

  // 2) Regra do ajudante (mesmo sexo OU mesma família que o estudante).
  const studentsByPart = new Map<string, CandidatePerson>();
  for (const assignment of incoming) {
    if (!SLOT_RULES[assignment.kind]?.helper) continue;
    const partBase = basePartId(assignment.partId);
    const studentAssignment = incoming.find(
      (candidate) =>
        candidate.partId === `${partBase}-student` &&
        !SLOT_RULES[candidate.kind]?.helper &&
        candidate.personId !== assignment.personId,
    );
    const student = studentAssignment ? byId.get(studentAssignment.personId) : undefined;
    const helper = byId.get(assignment.personId);
    if (!helper) continue;
    if (!studentAssignment || !student) {
      warnings.push({
        partId: assignment.partId,
        slotId: assignment.slotId,
        level: "warning",
        message: "Ajudante designado sem estudante correspondente nesta parte.",
      });
      continue;
    }
    studentsByPart.set(partBase, student);
    const check = helperMatchesStudent(helper, student);
    if (!check.eligible) {
      errors.push({
        partId: assignment.partId,
        slotId: assignment.slotId,
        level: "error",
        message:
          check.reason ?? "Ajudante precisa possuir o mesmo sexo do estudante ou ser da família.",
      });
    }
  }

  // 3) Mais de uma designação na mesma reunião (mesmo dia).
  const seen = new Map<string, { count: number; name: string; firstPartId: string }>();
  for (const assignment of incoming) {
    const entry = seen.get(assignment.personId);
    if (entry) {
      entry.count += 1;
      continue;
    }
    seen.set(assignment.personId, {
      count: 1,
      name: byId.get(assignment.personId)?.nome ?? "Publicador",
      firstPartId: assignment.partId,
    });
  }
  for (const entry of seen.values()) {
    if (entry.count > 1) {
      warnings.push({
        partId: entry.firstPartId,
        slotId: null,
        level: "warning",
        message: `${entry.name} já possui outra designação nesta reunião.`,
      });
    }
  }

  // 4) Também designado na outra reunião da mesma semana.
  const siblingSet = new Set(siblingPersonIds);
  if (siblingSet.size > 0) {
    const anchored = new Set<string>();
    for (const assignment of incoming) {
      if (!siblingSet.has(assignment.personId) || anchored.has(assignment.personId)) continue;
      anchored.add(assignment.personId);
      const name = byId.get(assignment.personId)?.nome ?? "Publicador";
      warnings.push({
        partId: assignment.partId,
        slotId: null,
        level: "warning",
        message: `${name} também está designado na reunião de ${meetingTypeLabel(
          input.meetingType === "MIDWEEK" ? "WEEKEND" : "MIDWEEK",
        )} desta semana.`,
      });
    }
  }

  return { errors, warnings };
}
