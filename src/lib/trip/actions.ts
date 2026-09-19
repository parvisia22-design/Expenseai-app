"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

async function requireOwnedReimbursement(reimbursementId: string) {
  const s = await auth();
  const userId = s?.user?.id;
  if (!userId) throw new Error("unauthorized");
  const r = await prisma.reimbursement.findFirst({
    where: { id: reimbursementId, userId },
    select: { id: true, status: true },
  });
  if (!r) throw new Error("not found");
  if (r.status !== "DRAFT") throw new Error("locked");
  return userId;
}

const TripInput = z.object({
  reimbursementId: z.string().min(1),
  label: z.string().min(1),
  visitedPlace: z.string().optional(),
  purpose: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function createTrip(fd: FormData) {
  const parsed = TripInput.parse({
    reimbursementId: fd.get("reimbursementId"),
    label: fd.get("label"),
    visitedPlace: fd.get("visitedPlace") ?? undefined,
    purpose: fd.get("purpose") ?? undefined,
    startDate: fd.get("startDate"),
    endDate: fd.get("endDate"),
  });
  await requireOwnedReimbursement(parsed.reimbursementId);
  const count = await prisma.trip.count({ where: { reimbursementId: parsed.reimbursementId } });
  await prisma.trip.create({
    data: {
      reimbursementId: parsed.reimbursementId,
      label: parsed.label,
      visitedPlace: parsed.visitedPlace || null,
      purpose: parsed.purpose || null,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      sortOrder: count,
    },
  });
  revalidatePath(`/report/${parsed.reimbursementId}`);
}

export async function deleteTrip(fd: FormData) {
  const tripId = String(fd.get("tripId") ?? "");
  const reimbursementId = String(fd.get("reimbursementId") ?? "");
  await requireOwnedReimbursement(reimbursementId);
  await prisma.trip.delete({ where: { id: tripId } });
  revalidatePath(`/report/${reimbursementId}`);
}

export async function assignLineToTrip(fd: FormData) {
  const lineId = String(fd.get("lineId") ?? "");
  const reimbursementId = String(fd.get("reimbursementId") ?? "");
  const tripIdRaw = String(fd.get("tripId") ?? "");
  const tripId = tripIdRaw === "" ? null : tripIdRaw;
  const userId = await requireOwnedReimbursement(reimbursementId);
  await prisma.expenseLine.update({
    where: { id: lineId, userId, reimbursementId },
    data: { tripId },
  });
  revalidatePath(`/report/${reimbursementId}`);
}
