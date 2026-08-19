import type { TalkItem } from "@/features/meetings/lib/jwpub";
import { prisma } from "@/lib/prisma";

export async function listTalks(organizationId: string) {
  return prisma.talk.findMany({
    where: { organizationId },
    orderBy: { number: "asc" },
  });
}

export async function replaceTalks(organizationId: string, items: TalkItem[]) {
  return prisma.$transaction([
    prisma.talk.deleteMany({ where: { organizationId } }),
    prisma.talk.createMany({
      data: items.map((item) => ({
        organizationId,
        number: item.number,
        theme: item.theme,
      })),
    }),
  ]);
}
