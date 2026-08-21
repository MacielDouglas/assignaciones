import { addDaysUtc, isoDay, parseIsoDay } from "@/features/meetings/lib/meeting-builder";
import { normalizePersonName } from "@/features/meetings/lib/schedule-rules";
import type { MeetingSpecialEvent } from "@/features/meetings/lib/special-events";
import {
  resolveSpecialEventForWeek,
  SPECIAL_EVENT_BEHAVIOR,
  SPECIAL_EVENT_TITLES,
} from "@/features/meetings/lib/special-events";
import { prisma } from "@/lib/prisma";

const VISITORS_FAMILY_NAME = "Visitantes";

/**
 * Garante que o viajante configurado no evento exista como publicador
 * `visitante` na congregação (família "Visitantes"), para aparecer como
 * opção de designação nas partes da visita. Idempotente.
 */
export async function ensureTravelerPerson(
  organizationId: string,
  event: MeetingSpecialEvent,
): Promise<void> {
  if (event.behavior !== "circuitOverseerVisit" || !event.travelerName?.trim()) return;

  const existing = await prisma.person.findFirst({
    where: { organizationId, visitante: true },
    select: { id: true, nome: true },
  });
  const target = normalizePersonName(event.travelerName);
  if (existing && normalizePersonName(existing.nome) === target) return;

  const family = await prisma.family.upsert({
    where: { organizationId_name: { organizationId, name: VISITORS_FAMILY_NAME } },
    create: { organizationId, name: VISITORS_FAMILY_NAME },
    update: {},
    select: { id: true },
  });

  if (existing) {
    // Viajante anterior com nome diferente: atualiza o registro do visitante.
    await prisma.person.update({
      where: { id: existing.id },
      data: { nome: event.travelerName.trim() },
    });
    return;
  }

  await prisma.person.create({
    data: {
      nome: event.travelerName.trim(),
      sexo: "MALE",
      organizationId,
      familiaId: family.id,
      ativo: true,
      estudante: false,
      batizado: true,
      limpeza: false,
      visitante: true,
    },
  });
}

/**
 * Busca, no servidor, os eventos especiais que intersectam a semana exibida
 * e resolve qual deles determina o comportamento das reuniões.
 */
export async function findSpecialEventForWeek(
  organizationId: string,
  weekStartIso: string,
): Promise<MeetingSpecialEvent | null> {
  const weekStart = parseIsoDay(weekStartIso);
  const weekEnd = addDaysUtc(weekStart, 6);

  const rows = await prisma.specialEvent.findMany({
    where: {
      organizationId,
      // Sobreposição de intervalos: [date, endDate ?? date] ∩ [weekStart, weekEnd]
      date: { lte: weekEnd },
      OR: [{ endDate: { gte: weekStart } }, { endDate: null, date: { gte: weekStart } }],
    },
    orderBy: { date: "asc" },
  });

  const events: MeetingSpecialEvent[] = rows
    .filter((row) => SPECIAL_EVENT_BEHAVIOR[row.kind] !== null)
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      behavior: SPECIAL_EVENT_BEHAVIOR[row.kind] as MeetingSpecialEvent["behavior"],
      title: SPECIAL_EVENT_TITLES[row.kind],
      theme: row.theme,
      location: row.location,
      startDateIso: isoDay(row.date),
      endDateIso: row.endDate ? isoDay(row.endDate) : isoDay(row.date),
      time: row.time,
      travelerName: row.traveler,
      serviceTalkTheme: row.serviceTalk,
      publicTalkTheme: row.publicTalk,
      finalTalkTheme: row.finalTalk,
    }));

  const resolved = resolveSpecialEventForWeek(events, weekStartIso);
  if (resolved) {
    await ensureTravelerPerson(organizationId, resolved);
  }
  return resolved;
}
