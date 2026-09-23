import { requireOrgContext } from "@/lib/org/context";
import { prisma } from "@/lib/db/prisma";
import { RouteClient } from "@/components/route/RouteClient";

export default async function RoutePage() {
  const ctx = await requireOrgContext();
  const drafts = await prisma.reimbursement.findMany({
    where: { userId: ctx.userId, orgId: ctx.membership.orgId, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, purpose: true },
    take: 10,
  });
  return <RouteClient drafts={drafts} hasMapsKey={!!process.env.GOOGLE_MAPS_API_KEY} />;
}
