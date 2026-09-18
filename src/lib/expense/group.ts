import { prisma } from "@/lib/db/prisma";
import type { ExpenseType, Prisma } from "@prisma/client";
import { recordPurposeLink } from "@/lib/learning/purpose-links";

/**
 * Find or create the DRAFT Reimbursement the user is currently building
 * for a given purpose. New attachments/lines dropped in chat roll up here.
 */
export async function upsertOpenReimbursement(opts: {
  userId: string;
  purpose: string;
  date: Date;
}) {
  const existing = await prisma.reimbursement.findFirst({
    where: {
      userId: opts.userId,
      status: "DRAFT",
      purpose: { equals: opts.purpose, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  const dayStart = new Date(opts.date);
  dayStart.setHours(0, 0, 0, 0);

  return prisma.reimbursement.create({
    data: {
      userId: opts.userId,
      title: opts.purpose,
      purpose: opts.purpose,
      periodStart: dayStart,
      periodEnd: dayStart,
    },
  });
}

export async function addLineWithAttachment(opts: {
  userId: string;
  reimbursementId: string;
  date: Date;
  type: ExpenseType;
  amount: number | null;
  purpose?: string | null;
  imageUrl: string;
  ocrJson?: unknown;
}) {
  const line = await prisma.expenseLine.create({
    data: {
      userId: opts.userId,
      reimbursementId: opts.reimbursementId,
      date: opts.date,
      type: opts.type,
      purpose: opts.purpose ?? null,
      amount: opts.amount ?? 0,
      ocrJson: opts.ocrJson as Prisma.InputJsonValue,
      attachments: {
        create: {
          imageUrl: opts.imageUrl,
          amount: opts.amount ?? null,
          ocrJson: opts.ocrJson as Prisma.InputJsonValue,
        },
      },
    },
  });
  await recomputeReimbursementTotal(opts.reimbursementId);
  return line;
}

export async function recomputeReimbursementTotal(reimbursementId: string) {
  const agg = await prisma.expenseLine.aggregate({
    where: { reimbursementId },
    _sum: { amount: true },
    _max: { date: true },
    _min: { date: true },
  });
  const total = agg._sum.amount ?? 0;
  await prisma.reimbursement.update({
    where: { id: reimbursementId },
    data: {
      totalAmount: total,
      ...(agg._min.date && agg._max.date
        ? { periodStart: agg._min.date, periodEnd: agg._max.date }
        : {}),
    },
  });
}

export async function submitReimbursement(userId: string, id: string) {
  const r = await prisma.reimbursement.findFirst({ where: { id, userId } });
  if (!r) throw new Error("not found");
  await prisma.reimbursement.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  const dests = await prisma.expenseLine.findMany({
    where: { reimbursementId: id, destId: { not: null } },
    select: { destId: true },
  });
  for (const d of dests) if (d.destId) await recordPurposeLink(userId, r.purpose, d.destId);
}
