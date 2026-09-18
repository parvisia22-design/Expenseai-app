import { prisma } from "@/lib/db/prisma";

// User typed a purpose ("Drone") → suggest destinations they've paired with it before.
export async function suggestPlacesForPurpose(userId: string, purpose: string) {
  return prisma.purposeLink.findMany({
    where: { userId, purpose: { equals: purpose, mode: "insensitive" } },
    include: { place: true },
    orderBy: { count: "desc" },
    take: 5,
  });
}

// User typed / selected a place ("Pabrik Jatake") → suggest purposes.
export async function suggestPurposesForPlace(userId: string, placeId: string) {
  return prisma.purposeLink.findMany({
    where: { userId, placeId },
    orderBy: { count: "desc" },
    take: 5,
    select: { purpose: true, count: true },
  });
}

// Every time a Trip is saved, bump the link.
export async function recordPurposeLink(userId: string, purpose: string, placeId: string) {
  const p = purpose.trim();
  if (!p || !placeId) return;
  await prisma.purposeLink.upsert({
    where: { userId_purpose_placeId: { userId, purpose: p, placeId } },
    update: { count: { increment: 1 } },
    create: { userId, purpose: p, placeId, count: 1 },
  });
}
