import { prisma } from "@/lib/db/prisma";
import type { AttachmentType } from "@prisma/client";
import { recordPurposeLink } from "@/lib/learning/purpose-links";

// Find-or-create the Trip for (user, date, purpose). Attachments dropped in the
// chat that share these keys roll up into the same Trip card.
export async function upsertDayTrip(opts: {
  userId: string;
  date: Date;
  purpose: string;
  originId?: string | null;
  destId?: string | null;
}) {
  const dayStart = new Date(opts.date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existing = await prisma.trip.findFirst({
    where: {
      userId: opts.userId,
      purpose: { equals: opts.purpose, mode: "insensitive" },
      date: { gte: dayStart, lt: dayEnd },
    },
  });
  if (existing) return existing;

  return prisma.trip.create({
    data: {
      userId: opts.userId,
      date: dayStart,
      purpose: opts.purpose,
      originId: opts.originId ?? null,
      destId: opts.destId ?? null,
    },
  });
}

export async function attachToTrip(opts: {
  userId: string;
  tripId: string;
  type: AttachmentType;
  imageUrl: string;
  amount?: number | null;
  ocrJson?: unknown;
}) {
  const att = await prisma.attachment.create({
    data: {
      tripId: opts.tripId,
      type: opts.type,
      imageUrl: opts.imageUrl,
      amount: opts.amount ?? null,
      ocrJson: opts.ocrJson as never,
    },
  });
  await recomputeTripTotals(opts.tripId);
  return att;
}

export async function recomputeTripTotals(tripId: string) {
  const atts = await prisma.attachment.findMany({ where: { tripId } });
  const sum = (t: AttachmentType) =>
    atts.filter((a) => a.type === t).reduce((n, a) => n + (a.amount ?? 0), 0);
  const mealAmount = sum("RECEIPT");
  const tollAmount = sum("TOLL");
  const parkingAmount = sum("PARKING");
  const otherAmount = sum("OTHER");
  const totalAmount = mealAmount + tollAmount + parkingAmount + otherAmount;
  await prisma.trip.update({
    where: { id: tripId },
    data: { mealAmount, tollAmount, parkingAmount, otherAmount, totalAmount },
  });
}

export async function finalizeTrip(userId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) throw new Error("trip not found");
  if (trip.destId) await recordPurposeLink(userId, trip.purpose, trip.destId);
  if (trip.originId) await recordPurposeLink(userId, trip.purpose, trip.originId);
  await prisma.trip.update({ where: { id: tripId }, data: { status: "SUBMITTED" } });
}
