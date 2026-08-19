import type { WatchtowerArticle } from "@/lib/jwpub";
import { prisma } from "@/lib/prisma";
import { workbookIssueKey, workbookLanguage } from "@/lib/workbook-meta";

const MAX_WATCHTOWERS_PER_LANGUAGE = 12;

export interface WatchtowerSaveInput {
  symbol: string;
  name: string;
  languageCode?: string;
  articles: WatchtowerArticle[];
}

export async function listWatchtowers(organizationId: string) {
  return prisma.watchtower.findMany({
    where: { organizationId },
    include: { articles: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function upsertWatchtower(organizationId: string, data: WatchtowerSaveInput) {
  const watchtower = await prisma.watchtower.upsert({
    where: { organizationId_symbol: { organizationId, symbol: data.symbol } },
    update: {
      name: data.name,
      languageCode: data.languageCode ?? null,
    },
    create: {
      organizationId,
      symbol: data.symbol,
      name: data.name,
      languageCode: data.languageCode ?? null,
    },
    include: { articles: { orderBy: { order: "asc" } } },
  });

  await prisma.$transaction([
    prisma.watchtowerArticle.deleteMany({ where: { watchtowerId: watchtower.id } }),
    prisma.watchtowerArticle.createMany({
      data: data.articles.map((article, index) => ({
        watchtowerId: watchtower.id,
        title: article.title,
        dates: article.dates ?? null,
        color: article.color ?? null,
        openingSong: article.openingSong ?? null,
        closingSong: article.closingSong ?? null,
        order: index,
      })),
    }),
  ]);

  return prisma.watchtower.findUnique({
    where: { id: watchtower.id },
    include: { articles: { orderBy: { order: "asc" } } },
  });
}

export async function deleteWatchtower(watchtowerId: string, organizationId: string) {
  return prisma.watchtower.deleteMany({
    where: { id: watchtowerId, organizationId },
  });
}

export async function pruneWatchtowers(organizationId: string) {
  const rows = await prisma.watchtower.findMany({
    where: { organizationId },
    select: { id: true, symbol: true },
  });

  const groups = new Map<string, { id: string; key: number }[]>();
  for (const row of rows) {
    const groupKey = workbookLanguage(row.symbol);
    const list = groups.get(groupKey) ?? [];
    list.push({ id: row.id, key: workbookIssueKey(row.symbol) });
    groups.set(groupKey, list);
  }

  const toDelete: string[] = [];
  for (const list of groups.values()) {
    list.sort((a, b) => b.key - a.key);
    for (const item of list.slice(MAX_WATCHTOWERS_PER_LANGUAGE)) toDelete.push(item.id);
  }

  if (toDelete.length > 0) {
    await prisma.watchtower.deleteMany({ where: { id: { in: toDelete } } });
  }
}

export async function migrateLegacyWatchtowers(organizationId: string) {
  const legacy = await prisma.meetingWorkbook.findMany({
    where: { organizationId, symbol: { startsWith: "w" } },
  });
  for (const row of legacy) {
    const content = row.content as {
      articles?: { title?: string; dates?: string }[];
    };
    const existing = await prisma.watchtower.findUnique({
      where: { organizationId_symbol: { organizationId, symbol: row.symbol } },
      select: { id: true },
    });
    if (!existing) {
      await prisma.watchtower.create({
        data: {
          organizationId,
          symbol: row.symbol,
          name: row.name,
          languageCode: row.languageCode,
          fileName: row.fileName,
          articles: {
            create: (content.articles ?? []).map((article, index) => ({
              title: article.title ?? "",
              dates: article.dates ?? null,
              order: index,
            })),
          },
        },
      });
    }
    await prisma.meetingWorkbook.delete({ where: { id: row.id } });
  }
}
