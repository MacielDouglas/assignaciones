import type {
  CleaningGeneral as CleaningGeneralRow,
  CleaningGeneralSector as CleaningGeneralSectorRow,
  CleaningSector as CleaningSectorRow,
  CleaningWeeklySector as CleaningWeeklySectorRow,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CleaningGeneralInput,
  CleaningGeneralUpdateInput,
  CleaningListSectorInput,
  CleaningSectorInput,
  CleaningWeeklyInput,
} from "../schemas";
import { isoDay, parseIsoDay, weekStartUtc } from "./schedule";
import type {
  CleaningSectorData,
  GeneralCleaningData,
  GeneralSectorData,
  WeeklyCleaningData,
  WeeklySectorData,
} from "./types";
import { EMPTY_WEEKLY_CLEANING } from "./types";

export const DEFAULT_SECTORS: CleaningSectorInput[] = [
  {
    name: "Banheiro Masculino",
    task: "Limpe o vaso sanitário, o mictório e a parede ao redor com desinfetante. Limpe os espelhos com um pano umedecido com água e detergente. Limpe as pias e torneiras com um pano umedecido e detergente.",
    peopleNeeded: 2,
    allowsYouth: true,
    allowedSex: "MALE",
  },
  {
    name: "Banheiro Feminino",
    task: "Limpe o vaso sanitário e a parede ao redor com desinfetante, recolha o lixo, passe um pano com desinfetante no chão. Limpe os espelhos com um pano umedecido com água e detergente. Limpe as pias e torneiras com um pano umedecido e detergente.",
    peopleNeeded: 2,
    allowsYouth: true,
    allowedSex: "FEMALE",
  },
  {
    name: "Auditório",
    task: "Varra ou aspire o chão, passe um pano umedecido no chão ou use o mop, se necessário. Para evitar acidentes, faça isso quando houver poucas pessoas no local.",
    peopleNeeded: 2,
    allowsYouth: true,
    allowedSex: "BOTH",
  },
  {
    name: "Abastecimento",
    task: "Abasteça os dispensers de papel higiênico, papel toalha, porta-copos, saboneteira e álcool em gel, se necessário.",
    peopleNeeded: 1,
    allowsYouth: true,
    allowedSex: "BOTH",
  },
  {
    name: "Tirar Lixo",
    task: "Recolha e descarte o lixo.",
    peopleNeeded: 1,
    allowsYouth: true,
    allowedSex: "BOTH",
  },
];

export const WEEKLY_SECTOR_DEFAULTS: CleaningListSectorInput[] = [
  {
    name: "Teias de aranha",
    task: "Retire as teias de aranha do teto e das luminárias com um espanador de cabo extensível.",
  },
  {
    name: "Piso",
    task: "Varra ou aspire o chão. Passe um pano umedecido no chão ou use o mop.",
  },
  {
    name: "Portas e janelas",
    task: "Limpe as portas, janelas, vidros e pingadeiras com um pano levemente umedecido, se necessário.",
  },
  {
    name: "Móveis",
    task: "Limpe as maçanetas, a tribuna, a mesa do palco, o bebedouro, os interruptores, os balcões e os dispensers de álcool em gel usando um pano umedecido com água e detergente.",
  },
  {
    name: "Microfones",
    task: "Higienize os microfones e seus cabos com um pano levemente umedecido em água e detergente. Nunca use um pano encharcado.",
  },
  {
    name: "Cadeiras",
    task: "Limpe os braços, assentos e encostos das cadeiras com um pano umedecido em água e algumas gotas de detergente.",
  },
  {
    name: "Calçadas",
    task: "Varra as calçadas. Recolha folhas e sujeira do estacionamento, área externa e jardins.",
  },
  {
    name: "Lavanderia",
    task: "Lave os panos.",
  },
  {
    name: "Perdidos e Achados",
    task: "Retire objetos pessoais deixados no Salão do Reino.",
  },
];

export const GENERAL_SECTOR_DEFAULTS: CleaningListSectorInput[] = [
  {
    name: "Paredes",
    task: "Remova manchas das paredes internas e externas usando uma solução de água e detergente neutro e uma esponja macia.",
  },
  {
    name: "Cortinas",
    task: "Limpe as persianas ou cortinas.",
  },
  {
    name: "Ventiladores",
    task: "Limpe os ventiladores.",
  },
  {
    name: "Banheiros",
    task: "Limpe os revestimentos das paredes e divisórias dos banheiros com pano umedecido e detergente. Limpe as divisórias próximas ao vaso sanitário e mictório com um pano umedecido e desinfetante.",
  },
  {
    name: "Grades e Portão",
    task: "Limpe as grades e o portão.",
  },
  {
    name: "Jardim",
    task: "Corte a grama e remova ervas daninhas dos jardins e do estacionamento. Faça a poda das plantas ornamentais e arbustos.",
  },
  {
    name: "Calçadas",
    task: "Lave as calçadas e outras áreas concretadas.",
  },
  {
    name: "Sala de limpeza",
    task: "Organize a sala de limpeza e lave as lixeiras.",
  },
];

function toSectorData(row: CleaningSectorRow): CleaningSectorData {
  return {
    id: row.id,
    name: row.name,
    task: row.task,
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
  const [row, dates] = await Promise.all([
    prisma.cleaningWeekly.findUnique({
      where: { organizationId },
    }),
    prisma.cleaningWeeklyDate.findMany({
      where: { organizationId },
      orderBy: [{ date: "asc" }],
    }),
  ]);
  if (!row) return EMPTY_WEEKLY_CLEANING;
  return {
    time: row.time,
    dates: dates.map((entry) => isoDay(entry.date)),
  };
}

export async function saveWeeklyCleaning(
  organizationId: string,
  data: CleaningWeeklyInput,
): Promise<WeeklyCleaningData> {
  const dates = data.dates.map((date) => ({ organizationId, date: parseIsoDay(date) }));
  await prisma.$transaction(async (tx) => {
    await tx.cleaningWeekly.upsert({
      where: { organizationId },
      update: { time: data.time },
      create: { organizationId, time: data.time },
    });
    await tx.cleaningWeeklyDate.deleteMany({ where: { organizationId } });
    await tx.cleaningWeeklyDate.createMany({ data: dates });
  });
  return { time: data.time, dates: data.dates };
}

export async function deleteWeeklyCleaning(organizationId: string): Promise<void> {
  await prisma.$transaction([
    prisma.cleaningWeeklyDate.deleteMany({ where: { organizationId } }),
    prisma.cleaningWeekly.deleteMany({ where: { organizationId } }),
  ]);
}

export async function weeklyDatesFor(organizationId: string): Promise<string[]> {
  const rows = await prisma.cleaningWeeklyDate.findMany({
    where: { organizationId },
    select: { date: true },
  });
  return rows.map((row) => isoDay(row.date));
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

function sameWeek(isoA: string, isoB: string): boolean {
  return weekStartUtc(parseIsoDay(isoA)).getTime() === weekStartUtc(parseIsoDay(isoB)).getTime();
}

async function weeklyConflictsWith(organizationId: string, dates: string[]): Promise<boolean> {
  const weeklyDates = await weeklyDatesFor(organizationId);
  if (weeklyDates.length === 0) return false;
  return dates.some((date) => weeklyDates.some((weekly) => sameWeek(date, weekly)));
}

async function assertNoWeeklyConflict(
  organizationId: string,
  dates: string[],
  acknowledged: boolean,
): Promise<string | null> {
  if (acknowledged) return null;
  const conflict = await weeklyConflictsWith(organizationId, dates);
  if (!conflict) return null;
  return "Existe Limpeza Semanal ativada na mesma semana. A Limpeza Semanal será cancelada na semana desta Limpeza Geral. Confirme o conflito para continuar.";
}

export async function createGeneralCleanings(
  organizationId: string,
  data: CleaningGeneralInput,
): Promise<{ cleanings: GeneralCleaningData[]; error?: string }> {
  const error = await assertNoWeeklyConflict(
    organizationId,
    data.dates.map((entry) => entry.date),
    data.acknowledgedConflict ?? false,
  );
  if (error) return { error, cleanings: [] };

  const rows = await prisma.cleaningGeneral.createManyAndReturn({
    data: data.dates.map((entry) => ({
      organizationId,
      date: parseIsoDay(entry.date),
      time: entry.time,
    })),
  });
  return { cleanings: rows.map(toGeneralData) };
}

export async function upsertGeneralCleaning(
  organizationId: string,
  data: CleaningGeneralUpdateInput,
  cleaningId?: string,
): Promise<{ cleaning?: GeneralCleaningData; error?: string }> {
  if (cleaningId) {
    const owned = await prisma.cleaningGeneral.findFirst({
      where: { id: cleaningId, organizationId },
      select: { id: true },
    });
    if (!owned) return { error: "Limpeza não encontrada." };
  }

  const error = await assertNoWeeklyConflict(
    organizationId,
    [data.date],
    data.acknowledgedConflict ?? false,
  );
  if (error) return { error };

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

type ListSectorRow = CleaningWeeklySectorRow | CleaningGeneralSectorRow;

interface ListSectorDelegate {
  findMany(args: {
    where: { organizationId: string };
    orderBy: { createdAt: "asc" }[];
  }): Promise<ListSectorRow[]>;
  findFirst(args: {
    where: { id: string; organizationId: string };
    select: { id: true };
  }): Promise<{ id: string } | null>;
  createMany(args: {
    data: ({ organizationId: string } & CleaningListSectorInput)[];
  }): Promise<{ count: number }>;
  upsert(args: {
    where: { id: string };
    update: CleaningListSectorInput;
    create: { organizationId: string } & CleaningListSectorInput;
  }): Promise<ListSectorRow>;
  deleteMany(args: { where: { id: string; organizationId: string } }): Promise<{ count: number }>;
}

function toListSectorData(row: ListSectorRow): WeeklySectorData {
  return {
    id: row.id,
    name: row.name,
    task: row.task,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getListSectors(
  model: ListSectorDelegate,
  organizationId: string,
  defaults: CleaningListSectorInput[],
): Promise<WeeklySectorData[]> {
  let rows = await model.findMany({
    where: { organizationId },
    orderBy: [{ createdAt: "asc" }],
  });
  if (rows.length === 0) {
    await model.createMany({
      data: defaults.map((sector) => ({ organizationId, ...sector })),
    });
    rows = await model.findMany({
      where: { organizationId },
      orderBy: [{ createdAt: "asc" }],
    });
  }
  return rows.map(toListSectorData);
}

async function upsertListSector(
  model: ListSectorDelegate,
  organizationId: string,
  data: CleaningListSectorInput,
  sectorId?: string,
): Promise<{ sector?: WeeklySectorData; error?: string }> {
  if (sectorId) {
    const owned = await model.findFirst({
      where: { id: sectorId, organizationId },
      select: { id: true },
    });
    if (!owned) return { error: "Setor não encontrado." };
  }

  const row = await model.upsert({
    where: { id: sectorId ?? "__new__" },
    update: data,
    create: { organizationId, ...data },
  });
  return { sector: toListSectorData(row) };
}

async function deleteListSector(
  model: ListSectorDelegate,
  sectorId: string,
  organizationId: string,
): Promise<{ deleted?: boolean; error?: string }> {
  const result = await model.deleteMany({
    where: { id: sectorId, organizationId },
  });
  if (result.count === 0) return { error: "Setor não encontrado." };
  return { deleted: true };
}

export function getWeeklySectors(organizationId: string): Promise<WeeklySectorData[]> {
  return getListSectors(prisma.cleaningWeeklySector, organizationId, WEEKLY_SECTOR_DEFAULTS);
}

export function upsertWeeklySector(
  organizationId: string,
  data: CleaningListSectorInput,
  sectorId?: string,
): Promise<{ sector?: WeeklySectorData; error?: string }> {
  return upsertListSector(prisma.cleaningWeeklySector, organizationId, data, sectorId);
}

export function deleteWeeklySector(
  sectorId: string,
  organizationId: string,
): Promise<{ deleted?: boolean; error?: string }> {
  return deleteListSector(prisma.cleaningWeeklySector, sectorId, organizationId);
}

export function getGeneralSectors(organizationId: string): Promise<GeneralSectorData[]> {
  return getListSectors(prisma.cleaningGeneralSector, organizationId, GENERAL_SECTOR_DEFAULTS);
}

export function upsertGeneralSector(
  organizationId: string,
  data: CleaningListSectorInput,
  sectorId?: string,
): Promise<{ sector?: GeneralSectorData; error?: string }> {
  return upsertListSector(prisma.cleaningGeneralSector, organizationId, data, sectorId);
}

export function deleteGeneralSector(
  sectorId: string,
  organizationId: string,
): Promise<{ deleted?: boolean; error?: string }> {
  return deleteListSector(prisma.cleaningGeneralSector, sectorId, organizationId);
}
