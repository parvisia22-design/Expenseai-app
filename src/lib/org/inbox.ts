import { prisma } from "@/lib/db/prisma";
import type { OrgRole } from "@prisma/client";
import { can } from "./context";
import { approvalPermissions } from "./approval";

type Viewer = { userId: string; membership: { id: string; orgId: string; role: OrgRole } };

// Claims in the active company that are waiting on this viewer.
export async function pendingApprovals(viewer: Viewer) {
  const { membership } = viewer;
  if (!can.review(membership.role)) return [];

  const [rows, orgRoles] = await Promise.all([
    prisma.reimbursement.findMany({
      where: {
        orgId: membership.orgId,
        status: { in: ["SUBMITTED", "SUPERVISOR_APPROVED", "FINANCE_APPROVED"] },
      },
      include: {
        user: { select: { id: true, email: true, name: true, displayName: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.membership.findMany({
      where: { orgId: membership.orgId },
      select: { userId: true, role: true, approverId: true, division: true },
    }),
  ]);
  const byUser = new Map(orgRoles.map((m) => [m.userId, m]));

  return rows
    .map((r) => {
      const sub = byUser.get(r.userId);
      const perms = approvalPermissions({
        viewerUserId: viewer.userId,
        viewerMembershipId: membership.id,
        viewerRole: membership.role,
        submitterUserId: r.userId,
        submitterApproverId: sub?.approverId ?? null,
        status: r.status,
        orgRoles,
      });
      return { r, division: sub?.division ?? null, perms };
    })
    .filter((x) => x.perms.canSupervise || x.perms.canFinance || x.perms.canMarkPaid);
}
