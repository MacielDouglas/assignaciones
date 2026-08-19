import type { SongItem } from "@/lib/jwpub";
import { prisma } from "@/lib/prisma";

export async function listSongs(organizationId: string) {
  return prisma.song.findMany({
    where: { organizationId },
    orderBy: { number: "asc" },
  });
}

export async function replaceSongs(organizationId: string, items: SongItem[]) {
  return prisma.$transaction([
    prisma.song.deleteMany({ where: { organizationId } }),
    prisma.song.createMany({
      data: items.map((item) => ({
        organizationId,
        number: item.number,
        theme: item.theme,
      })),
    }),
  ]);
}
