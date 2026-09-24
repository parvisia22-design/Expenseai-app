"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { PLAN_INFO } from "@/lib/org/plans";
import { requirePlatformAdmin } from "./admin";

const PLANS = ["TRIAL", "STARTER", "BUSINESS", "ENTERPRISE", "COMPLIMENTARY"] as const;

export async function setOrganizationPlan(fd: FormData) {
  await requirePlatformAdmin();
  const { orgId, plan } = z
    .object({ orgId: z.string().min(1), plan: z.enum(PLANS) })
    .parse({ orgId: fd.get("orgId"), plan: fd.get("plan") });

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan,
      seatLimit: PLAN_INFO[plan].seats,
      // Anything other than a trial is treated as active; comped and paid
      // plans have no trial clock.
      subscriptionStatus: plan === "TRIAL" ? "TRIALING" : "ACTIVE",
      trialEndsAt: plan === "TRIAL" ? new Date(Date.now() + 14 * 86_400_000) : null,
    },
  });
  revalidatePath("/admin");
}
