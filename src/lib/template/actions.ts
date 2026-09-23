"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { upsertOpenReimbursement, recomputeReimbursementTotal } from "@/lib/expense/group";
import { requireOrgContext } from "@/lib/org/context";

const TemplateInput = z.object({
  name: z.string().min(1),
  purpose: z.string().min(1),
  originText: z.string().optional(),
  destText: z.string().optional(),
  distanceKm: z.coerce.number().nonnegative().optional(),
  tollAmount: z.coerce.number().int().nonnegative().default(0),
  parkingAmount: z.coerce.number().int().nonnegative().default(0),
  mealAmount: z.coerce.number().int().nonnegative().default(0),
});

export async function createTemplate(fd: FormData) {
  const s = await auth();
  if (!s?.user?.id) throw new Error("unauthorized");
  const parsed = TemplateInput.parse({
    name: fd.get("name"),
    purpose: fd.get("purpose"),
    originText: fd.get("originText") ?? undefined,
    destText: fd.get("destText") ?? undefined,
    distanceKm: fd.get("distanceKm") || undefined,
    tollAmount: fd.get("tollAmount") || 0,
    parkingAmount: fd.get("parkingAmount") || 0,
    mealAmount: fd.get("mealAmount") || 0,
  });
  await prisma.recurringTemplate.create({
    data: { userId: s.user.id, ...parsed },
  });
  revalidatePath("/templates");
}

export async function deleteTemplate(fd: FormData) {
  const s = await auth();
  if (!s?.user?.id) throw new Error("unauthorized");
  const id = String(fd.get("id") ?? "");
  await prisma.recurringTemplate.delete({ where: { id, userId: s.user.id } });
  revalidatePath("/templates");
}

export async function applyTemplate(fd: FormData) {
  const s = await auth();
  if (!s?.user?.id) throw new Error("unauthorized");
  const id = String(fd.get("id") ?? "");

  const t = await prisma.recurringTemplate.findFirst({ where: { id, userId: s.user.id } });
  if (!t) throw new Error("template not found");

  const today = new Date();
  const ctx = await requireOrgContext();
  const rate = ctx.membership.org.mileageRatePerKm;
  const r = await upsertOpenReimbursement({ userId: s.user.id, orgId: ctx.membership.orgId, purpose: t.purpose, date: today });
  const place = t.originText && t.destText ? `${t.originText} → ${t.destText}` : t.destText ?? t.originText ?? "";

  if (t.distanceKm) {
    await prisma.expenseLine.create({
      data: {
        userId: s.user.id, reimbursementId: r.id, date: today,
        type: "MILEAGE", placeText: place, mileageKm: t.distanceKm,
        unit: "km", quantity: t.distanceKm, unitPrice: rate,
        description: `${t.distanceKm} km`, amount: Math.round(t.distanceKm * rate),
      },
    });
  }
  if (t.tollAmount > 0) {
    await prisma.expenseLine.create({
      data: { userId: s.user.id, reimbursementId: r.id, date: today, type: "TOLL_PARKING", placeText: place, amount: t.tollAmount },
    });
  }
  if (t.parkingAmount > 0) {
    await prisma.expenseLine.create({
      data: { userId: s.user.id, reimbursementId: r.id, date: today, type: "TOLL_PARKING", placeText: `${place} (parkir)`, amount: t.parkingAmount },
    });
  }
  if (t.mealAmount > 0) {
    await prisma.expenseLine.create({
      data: { userId: s.user.id, reimbursementId: r.id, date: today, type: "MEAL", placeText: place, amount: t.mealAmount },
    });
  }
  await recomputeReimbursementTotal(r.id);
  await prisma.recurringTemplate.update({
    where: { id }, data: { lastUsedAt: new Date(), useCount: { increment: 1 } },
  });
  redirect(`/report/${r.id}`);
}
