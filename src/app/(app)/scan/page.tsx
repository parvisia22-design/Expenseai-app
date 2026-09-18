import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { ScanClient } from "@/components/scan/ScanClient";

export default async function ScanPage() {
  const session = await auth();
  const openDraft = await prisma.reimbursement.findFirst({
    where: { userId: session!.user!.id, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    select: { purpose: true },
  });
  return <ScanClient suggestedPurpose={openDraft?.purpose ?? ""} />;
}
