import type { OrgRole, ReimbursementStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { can } from "./context";

export type ApprovalPerms = {
  canSupervise: boolean;
  canFinance: boolean;
  canMarkPaid: boolean;
  canReject: boolean;
  canReopen: boolean;
};

// Pure permission rules for one viewer looking at one claim.
// A submitter can't sign off their own claim at a step — unless nobody else
// in the company is able to do that step (e.g. a one-person company).
export function approvalPermissions(o: {
  viewerUserId: string;
  viewerMembershipId: string;
  viewerRole: OrgRole;
  submitterUserId: string;
  submitterApproverId: string | null;
  status: ReimbursementStatus;
  orgRoles: { userId: string; role: OrgRole }[];
}): ApprovalPerms {
  const isSubmitter = o.viewerUserId === o.submitterUserId;
  const others = o.orgRoles.filter((m) => m.userId !== o.submitterUserId);
  const selfSuperviseOk = !isSubmitter || !others.some((m) => can.approve(m.role));
  const selfFinanceOk = !isSubmitter || !others.some((m) => can.finance(m.role));
  const assignedOk = o.submitterApproverId
    ? o.submitterApproverId === o.viewerMembershipId || can.manage(o.viewerRole)
    : can.approve(o.viewerRole);

  const canSupervise = o.status === "SUBMITTED" && selfSuperviseOk && assignedOk;
  const canFinance = o.status === "SUPERVISOR_APPROVED" && selfFinanceOk && can.finance(o.viewerRole);
  const canMarkPaid = o.status === "FINANCE_APPROVED" && can.finance(o.viewerRole);
  return {
    canSupervise,
    canFinance,
    canMarkPaid,
    canReject: canSupervise || canFinance,
    canReopen: isSubmitter && (o.status === "SUBMITTED" || o.status === "REJECTED"),
  };
}

export async function permsFor(reimbursementId: string, viewer: { userId: string; membershipId: string; role: OrgRole; orgId: string }) {
  const r = await prisma.reimbursement.findFirst({
    where: { id: reimbursementId, orgId: viewer.orgId },
    select: { id: true, userId: true, status: true },
  });
  if (!r) return null;
  const orgRoles = await prisma.membership.findMany({
    where: { orgId: viewer.orgId },
    select: { userId: true, role: true, approverId: true },
  });
  const submitter = orgRoles.find((m) => m.userId === r.userId);
  return {
    reimbursement: r,
    perms: approvalPermissions({
      viewerUserId: viewer.userId,
      viewerMembershipId: viewer.membershipId,
      viewerRole: viewer.role,
      submitterUserId: r.userId,
      submitterApproverId: submitter?.approverId ?? null,
      status: r.status,
      orgRoles,
    }),
  };
}
