import type {
  CleaningGeneral as CleaningGeneralRow,
  CleaningSector as CleaningSectorRow,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CleaningGeneralInput, CleaningSectorInput, CleaningWeeklyInput } from "../schemas";
import { isoDay, parseIsoDay } from "./schedule";
import type { CleaningSectorData, GeneralCleaningData, WeeklyCleaningData } from "./types";
import { EMPTY_WEEKLY_CLEANING } from "./types";

export const DEFAULT_SECTORS: CleaningSectorInput[] = [
  { name: "Banheiro Masculino", peopleNeeded: 2, allowsYouth: true, allowedSex: "MALE" },
  { name: "Banheiro Feminino", peopleNeeded: 2, allowsYouth: true, allowedSex: "FEMALE" },
  { name: "Auditório", peopleNeeded: 2, allowsYouth: true, allowedSex: "BOTH" },
  { name: "Abastecimento", peopleNeeded: 1, allowsYouth: true, allowedSex: "BOTH" },
  { name: "Tirar Lixo", peopleNeeded: 1, allowsYouth: true, allowedSex: "BOTH" },
];

function toSectorData(row: CleaningSectorRow): CleaningSectorData {
  return {
    id: row.id,
    name: row.name,
    peopleNeeded: row.peopleNeeded,
    allowsYouth: row.allowsYouth,
    allowedSex: row.allowedSex,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSectors(organizationId: string): Promise<CleaningSectorData[]> {
  let rows = await prisma.cleaningSector.findMany({
    where: { organizationId },
    orderBy: [{ createdAt: "asc" }],
  });
  if (rows.length === 0) {
    await prisma.cleaningSector.createMany({
      data: DEFAULT_SECTORS.map((sector) => ({ organizationId, ...sector })),
    });
    rows = await prisma.cleaningSector.findMany({
      where: { organizationId },
      orderBy: [{ createdAt: "asc" }],
    });
  }
  return rows.map(toSectorData);
}

export async function upsertSector(
  organizationId: string,
  data: CleaningSectorInput,
  sectorId?: string,
): Promise<{ sector?: CleaningSectorData; error?: string }> {
  if (sectorId) {
    const owned = await prisma.cleaningSector.findFirst({
      where: { id: sectorId, organizationId },
      select: { id: true },
    });
    if (!owned) return { error: "Setor não encontrado." };
  }

  const row = await prisma.cleaningSector.upsert({
    where: { id: sectorId ?? "__new__" },
    update: data,
    create: { organizationId, ...data },
  });
  return { sector: toSectorData(row) };
}

export async function deleteSector(
  sectorId: string,
  organizationId: string,
): Promise<{ deleted?: boolean; error?: string }> {
  const result = await prisma.cleaningSector.deleteMany({
    where: { id: sectorId, organizationId },
  });
  if (result.count === 0) return { error: "Setor não encontrado." };
  return { deleted: true };
}

export async function getWeeklyCleaning(organizationId: string): Promise<WeeklyCleaningData> {
  const row = await prisma.cleaningWeekly.findUnique({
    where: { organizationId },
  });
  if (!row) return EMPTY_WEEKLY_CLEANING;
  return {
    enabled: row.enabled,
    day: row.day,
    time: row.time,
  };
}

export async function saveWeeklyCleaning(
  organizationId: string,
  data: CleaningWeeklyInput,
): Promise<WeeklyCleaningData> {
  await prisma.cleaningWeekly.upsert({
    where: { organizationId },
    update: data,
    create: { organizationId, ...data },
  });
  return data;
}

function toGeneralData(row: CleaningGeneralRow): GeneralCleaningData {
  return {
    id: row.id,
    date: isoDay(row.date),
    time: row.time,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listGeneralCleanings(organizationId: string): Promise<GeneralCleaningData[]> {
  const rows = await prisma.cleaningGeneral.findMany({
    where: { organizationId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toGeneralData);
}

export async function upsertGeneralCleaning(
  organizationId: string,
  data: CleaningGeneralInput,
  cleaningId?: string,
): Promise<{ cleaning?: GeneralCleaningData; error?: string }> {
  if (cleaningId) {
    const owned = await prisma.cleaningGeneral.findFirst({
      where: { id: cleaningId, organizationId },
      select: { id: true },
    });
    if (!owned) return { error: "Limpeza não encontrada." };
  }

  const weekly = await prisma.cleaningWeekly.findUnique({
    where: { organizationId },
  });
  if (weekly?.enabled && !data.acknowledgedConflict) {
    return {
      error:
        "Existe Limpeza Semanal ativada. A Limpeza Semanal será cancelada na semana desta Limpeza Geral. Confirme o conflito para continuar.",
    };
  }

  const row = await prisma.cleaningGeneral.upsert({
    where: { id: cleaningId ?? "__new__" },
    update: {
      date: parseIsoDay(data.date),
      time: data.time,
    },
    create: {
      organizationId,
      date: parseIsoDay(data.date),
      time: data.time,
    },
  });
  return { cleaning: toGeneralData(row) };
}

export async function deleteGeneralCleaning(
  cleaningId: string,
  organizationId: string,
): Promise<{ deleted?: boolean; error?: string }> {
  const result = await prisma.cleaningGeneral.deleteMany({
    where: { id: cleaningId, organizationId },
  });
  if (result.count === 0) return { error: "Limpeza não encontrada." };
  return { deleted: true };
}
