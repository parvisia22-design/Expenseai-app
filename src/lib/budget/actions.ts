"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const BudgetInput = z.object({
  purpose: z.string().min(1),
  amount: z.coerce.number().int().nonnegative(),
});

export async function upsertBudget(fd: FormData) {
  const s = await auth();
  if (!s?.user?.id) throw new Error("unauthorized");
  const parsed = BudgetInput.parse({
    purpose: fd.get("purpose"),
    amount: fd.get("amount"),
  });
  await prisma.budget.upsert({
    where: { userId_purpose: { userId: s.user.id, purpose: parsed.purpose } },
    update: { amount: parsed.amount },
    create: { userId: s.user.id, purpose: parsed.purpose, amount: parsed.amount },
  });
  revalidatePath("/budgets");
  revalidatePath("/analytics");
}

export async function deleteBudget(fd: FormData) {
  const s = await auth();
  if (!s?.user?.id) throw new Error("unauthorized");
  const id = String(fd.get("id") ?? "");
  await prisma.budget.delete({ where: { id, userId: s.user.id } });
  revalidatePath("/budgets");
}
