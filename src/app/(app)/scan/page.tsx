import { requireOrgContext } from "@/lib/org/context";
import { prisma } from "@/lib/db/prisma";
import { ScanClient } from "@/components/scan/ScanClient";

export default async function ScanPage() {
  const ctx = await requireOrgContext();
  const openDraft = await prisma.reimbursement.findFirst({
    where: { userId: ctx.userId, orgId: ctx.membership.orgId, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    select: { purpose: true },
  });
  return <ScanClient suggestedPurpose={openDraft?.purpose ?? ""} />;
}
