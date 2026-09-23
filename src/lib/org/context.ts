import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { OrgRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const ORG_COOKIE = "org";

// Resolves the signed-in user's active company. The `org` cookie picks which
// one when a user belongs to several; otherwise the oldest membership wins.
export const getOrgContext = cache(async () => {
  const s = await auth();
  const userId = s?.user?.id;
  if (!userId) return null;

  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { org: true },
    orderBy: { createdAt: "asc" },
  });
  const wanted = (await cookies()).get(ORG_COOKIE)?.value;
  const membership = memberships.find((m) => m.orgId === wanted) ?? memberships[0] ?? null;

  return { userId, email: s.user?.email ?? "", membership, memberships };
});

export async function requireOrgContext() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!ctx.membership) redirect("/onboarding");
  return { ...ctx, membership: ctx.membership };
}

export const MANAGE_ROLES: OrgRole[] = ["OWNER", "ADMIN"];
export const APPROVER_ROLES: OrgRole[] = ["OWNER", "ADMIN", "APPROVER"];
export const FINANCE_ROLES: OrgRole[] = ["OWNER", "ADMIN", "FINANCE"];
export const REVIEW_ROLES: OrgRole[] = ["OWNER", "ADMIN", "APPROVER", "FINANCE"];

export const can = {
  manage: (r: OrgRole) => MANAGE_ROLES.includes(r),
  approve: (r: OrgRole) => APPROVER_ROLES.includes(r),
  finance: (r: OrgRole) => FINANCE_ROLES.includes(r),
  review: (r: OrgRole) => REVIEW_ROLES.includes(r),
};

export const ROLE_LABEL: Record<OrgRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  APPROVER: "Supervisor",
  FINANCE: "Finance",
  MEMBER: "Karyawan",
};
