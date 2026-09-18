"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { recomputeReimbursementTotal } from "@/lib/expense/group";
import type { ExpenseType } from "@prisma/client";

const TYPES: ExpenseType[] = [
  "TICKETS", "HOTEL", "RENTAL_CAR", "TRANSPORT", "TOLL_PARKING",
  "PETROL", "MILEAGE", "MEAL", "ENTERTAINMENT", "EXTRA", "OTHER",
];

async function requireOwner(reimbursementId: string) {
  const s = await auth();
  const userId = s?.user?.id;
  if (!userId) throw new Error("unauthorized");
  const r = await prisma.reimbursement.findFirst({
    where: { id: reimbursementId, userId },
    select: { id: true, status: true },
  });
  if (!r) throw new Error("not found");
  if (r.status !== "DRAFT") throw new Error("locked: reimbursement already submitted");
  return userId;
}

const HeaderInput = z.object({
  reimbursementId: z.string().min(1),
  title: z.string().min(1),
  purpose: z.string().min(1),
  visitedPlace: z.string().optional(),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});

export async function updateHeader(fd: FormData) {
  const parsed = HeaderInput.parse({
    reimbursementId: fd.get("reimbursementId"),
    title: fd.get("title"),
    purpose: fd.get("purpose"),
    visitedPlace: fd.get("visitedPlace") ?? undefined,
    periodStart: fd.get("periodStart"),
    periodEnd: fd.get("periodEnd"),
  });
  await requireOwner(parsed.reimbursementId);
  await prisma.reimbursement.update({
    where: { id: parsed.reimbursementId },
    data: {
      title: parsed.title,
      purpose: parsed.purpose,
      visitedPlace: parsed.visitedPlace || null,
      periodStart: new Date(parsed.periodStart),
      periodEnd: new Date(parsed.periodEnd),
    },
  });
  revalidatePath(`/report/${parsed.reimbursementId}`);
}

const LineInput = z.object({
  reimbursementId: z.string().min(1),
  date: z.string().min(1),
  type: z.enum(TYPES as [ExpenseType, ...ExpenseType[]]),
  amount: z.coerce.number().int().nonnegative(),
  description: z.string().optional(),
  placeText: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.coerce.number().nonnegative().optional(),
  unitPrice: z.coerce.number().int().nonnegative().optional(),
});

export async function addLine(fd: FormData) {
  const parsed = LineInput.parse({
    reimbursementId: fd.get("reimbursementId"),
    date: fd.get("date"),
    type: fd.get("type"),
    amount: fd.get("amount"),
    description: fd.get("description") ?? undefined,
    placeText: fd.get("placeText") ?? undefined,
    unit: fd.get("unit") ?? undefined,
    quantity: fd.get("quantity") || undefined,
    unitPrice: fd.get("unitPrice") || undefined,
  });
  const userId = await requireOwner(parsed.reimbursementId);
  await prisma.expenseLine.create({
    data: {
      userId,
      reimbursementId: parsed.reimbursementId,
      date: new Date(parsed.date),
      type: parsed.type,
      amount: parsed.amount,
      description: parsed.description || null,
      placeText: parsed.placeText || null,
      unit: parsed.unit || null,
      quantity: parsed.quantity ?? null,
      unitPrice: parsed.unitPrice ?? null,
    },
  });
  await recomputeReimbursementTotal(parsed.reimbursementId);
  revalidatePath(`/report/${parsed.reimbursementId}`);
}

const UpdateLineInput = z.object({
  lineId: z.string().min(1),
  reimbursementId: z.string().min(1),
  amount: z.coerce.number().int().nonnegative(),
  description: z.string().optional(),
});

export async function updateLine(fd: FormData) {
  const parsed = UpdateLineInput.parse({
    lineId: fd.get("lineId"),
    reimbursementId: fd.get("reimbursementId"),
    amount: fd.get("amount"),
    description: fd.get("description") ?? undefined,
  });
  const userId = await requireOwner(parsed.reimbursementId);
  await prisma.expenseLine.update({
    where: { id: parsed.lineId, userId, reimbursementId: parsed.reimbursementId },
    data: {
      amount: parsed.amount,
      description: parsed.description || null,
    },
  });
  await recomputeReimbursementTotal(parsed.reimbursementId);
  revalidatePath(`/report/${parsed.reimbursementId}`);
}

export async function deleteLine(fd: FormData) {
  const lineId = String(fd.get("lineId") ?? "");
  const reimbursementId = String(fd.get("reimbursementId") ?? "");
  if (!lineId || !reimbursementId) throw new Error("bad input");
  const userId = await requireOwner(reimbursementId);
  await prisma.expenseLine.delete({ where: { id: lineId, userId, reimbursementId } });
  await recomputeReimbursementTotal(reimbursementId);
  revalidatePath(`/report/${reimbursementId}`);
}

export async function deleteReimbursement(fd: FormData) {
  const id = String(fd.get("reimbursementId") ?? "");
  await requireOwner(id);
  await prisma.reimbursement.delete({ where: { id } });
  revalidatePath("/reimbursements");
}

// ─── Approval workflow ─────────────────────────────────────────
// Single-user for now: user self-approves each step to track state.
// When multi-user is added, gate these on role (Supervisor / Finance).

async function requireOwnedReimbursement(id: string) {
  const s = await auth();
  const userId = s?.user?.id;
  if (!userId) throw new Error("unauthorized");
  const r = await prisma.reimbursement.findFirst({ where: { id, userId }, select: { id: true, status: true } });
  if (!r) throw new Error("not found");
  return { userId, status: r.status };
}

export async function approveSupervisor(fd: FormData) {
  const id = String(fd.get("reimbursementId") ?? "");
  const { status } = await requireOwnedReimbursement(id);
  if (status !== "SUBMITTED") throw new Error(`cannot approve from ${status}`);
  await prisma.reimbursement.update({
    where: { id },
    data: { status: "SUPERVISOR_APPROVED", supervisorAt: new Date() },
  });
  revalidatePath(`/report/${id}`);
}

export async function approveFinance(fd: FormData) {
  const id = String(fd.get("reimbursementId") ?? "");
  const { status } = await requireOwnedReimbursement(id);
  if (status !== "SUPERVISOR_APPROVED") throw new Error(`cannot approve from ${status}`);
  await prisma.reimbursement.update({
    where: { id },
    data: { status: "FINANCE_APPROVED", financeAt: new Date() },
  });
  revalidatePath(`/report/${id}`);
}

export async function markReimbursed(fd: FormData) {
  const id = String(fd.get("reimbursementId") ?? "");
  const { status } = await requireOwnedReimbursement(id);
  if (status !== "FINANCE_APPROVED") throw new Error(`cannot mark from ${status}`);
  await prisma.reimbursement.update({ where: { id }, data: { status: "REIMBURSED" } });
  revalidatePath(`/report/${id}`);
}

export async function reopenDraft(fd: FormData) {
  const id = String(fd.get("reimbursementId") ?? "");
  await requireOwnedReimbursement(id);
  await prisma.reimbursement.update({
    where: { id },
    data: { status: "DRAFT", submittedAt: null, supervisorAt: null, financeAt: null },
  });
  revalidatePath(`/report/${id}`);
}
