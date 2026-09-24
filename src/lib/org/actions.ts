"use server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { OrgRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { ORG_COOKIE, can, requireOrgContext } from "./context";
import { BILLING_ENABLED, PLAN_INFO, TRIAL_DAYS } from "./plans";

const ROLES = ["OWNER", "ADMIN", "APPROVER", "FINANCE", "MEMBER"] as const;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "company";

async function setActiveOrg(orgId: string) {
  (await cookies()).set(ORG_COOKIE, orgId, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

async function requireManager() {
  const ctx = await requireOrgContext();
  if (!can.manage(ctx.membership.role)) throw new Error("forbidden");
  return ctx;
}

// ─── Create company (onboarding) ─────────────────────────────────
export async function createOrganization(fd: FormData) {
  const s = await auth();
  const userId = s?.user?.id;
  if (!userId) redirect("/login");

  const name = z.string().trim().min(2).parse(fd.get("name"));
  const me = await prisma.user.findUnique({ where: { id: userId } });

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const org = await prisma.organization.create({
    data: {
      name,
      slug: `${slugify(name)}-${randomBytes(3).toString("hex")}`,
      trialEndsAt,
      seatLimit: PLAN_INFO.TRIAL.seats,
      memberships: {
        create: {
          userId,
          role: "OWNER",
          division: me?.division ?? null,
          employeeNumber: me?.employeeNumber ?? null,
        },
      },
    },
  });

  // Claims created before multi-tenancy move into the user's first company.
  await prisma.reimbursement.updateMany({ where: { userId, orgId: null }, data: { orgId: org.id } });

  await setActiveOrg(org.id);
  redirect("/org");
}

export async function switchOrganization(fd: FormData) {
  const ctx = await requireOrgContext();
  const orgId = String(fd.get("orgId") ?? "");
  if (!ctx.memberships.some((m) => m.orgId === orgId)) throw new Error("forbidden");
  await setActiveOrg(orgId);
  revalidatePath("/", "layout");
  redirect("/reimbursements");
}

// ─── Company settings ───────────────────────────────────────────
export async function updateOrganization(fd: FormData) {
  const ctx = await requireManager();
  const parsed = z
    .object({
      name: z.string().trim().min(2),
      address: z.string().trim().optional(),
      mileageRatePerKm: z.coerce.number().int().nonnegative(),
    })
    .parse({
      name: fd.get("name"),
      address: fd.get("address") ?? undefined,
      mileageRatePerKm: fd.get("mileageRatePerKm") || 0,
    });
  await prisma.organization.update({
    where: { id: ctx.membership.orgId },
    data: { name: parsed.name, address: parsed.address || null, mileageRatePerKm: parsed.mileageRatePerKm },
  });
  revalidatePath("/org");
}

// ─── Invitations ─────────────────────────────────────────────────
export async function createInvitation(fd: FormData) {
  const ctx = await requireManager();
  const parsed = z
    .object({ email: z.string().trim().toLowerCase().email(), role: z.enum(ROLES) })
    .parse({ email: fd.get("email"), role: fd.get("role") });

  // Only an owner can mint another owner.
  if (parsed.role === "OWNER" && ctx.membership.role !== "OWNER") throw new Error("forbidden");

  const orgId = ctx.membership.orgId;
  const [members, pending, org, already] = await Promise.all([
    prisma.membership.count({ where: { orgId } }),
    prisma.invitation.count({ where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } } }),
    prisma.organization.findUniqueOrThrow({ where: { id: orgId } }),
    prisma.membership.findFirst({ where: { orgId, user: { email: parsed.email } } }),
  ]);
  if (already) throw new Error("Email ini sudah menjadi anggota.");
  if (BILLING_ENABLED && members + pending >= org.seatLimit) {
    throw new Error(`Batas ${org.seatLimit} anggota untuk paket ini sudah tercapai.`);
  }

  await prisma.invitation.create({
    data: {
      orgId,
      email: parsed.email,
      role: parsed.role,
      token: randomBytes(24).toString("base64url"),
      invitedById: ctx.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  revalidatePath("/org");
}

export async function revokeInvitation(fd: FormData) {
  const ctx = await requireManager();
  const id = String(fd.get("id") ?? "");
  await prisma.invitation.deleteMany({ where: { id, orgId: ctx.membership.orgId, acceptedAt: null } });
  revalidatePath("/org");
}

export async function acceptInvitation(fd: FormData) {
  const s = await auth();
  const userId = s?.user?.id;
  const email = s?.user?.email?.toLowerCase();
  const token = String(fd.get("token") ?? "");
  if (!userId || !email) redirect(`/login?callbackUrl=/invite/${token}`);

  const inv = await prisma.invitation.findUnique({ where: { token } });
  if (!inv || inv.acceptedAt || inv.expiresAt < new Date()) throw new Error("Undangan tidak valid atau kedaluwarsa.");
  if (inv.email.toLowerCase() !== email) throw new Error(`Undangan ini untuk ${inv.email}.`);

  const me = await prisma.user.findUnique({ where: { id: userId } });
  await prisma.$transaction([
    prisma.membership.upsert({
      where: { orgId_userId: { orgId: inv.orgId, userId } },
      update: {},
      create: {
        orgId: inv.orgId,
        userId,
        role: inv.role,
        division: me?.division ?? null,
        employeeNumber: me?.employeeNumber ?? null,
      },
    }),
    prisma.invitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } }),
  ]);

  await setActiveOrg(inv.orgId);
  redirect("/chat");
}

// ─── Members ─────────────────────────────────────────────────────
export async function updateMember(fd: FormData) {
  const ctx = await requireManager();
  const parsed = z
    .object({
      membershipId: z.string().min(1),
      role: z.enum(ROLES),
      division: z.string().trim().optional(),
      approverId: z.string().optional(),
    })
    .parse({
      membershipId: fd.get("membershipId"),
      role: fd.get("role"),
      division: fd.get("division") ?? undefined,
      approverId: fd.get("approverId") ?? undefined,
    });

  const orgId = ctx.membership.orgId;
  const target = await prisma.membership.findFirst({ where: { id: parsed.membershipId, orgId } });
  if (!target) throw new Error("not found");
  if ((target.role === "OWNER" || parsed.role === "OWNER") && ctx.membership.role !== "OWNER") {
    throw new Error("Hanya Owner yang bisa mengubah peran Owner.");
  }
  if (target.role === "OWNER" && parsed.role !== "OWNER") {
    const owners = await prisma.membership.count({ where: { orgId, role: "OWNER" } });
    if (owners <= 1) throw new Error("Perusahaan harus punya minimal satu Owner.");
  }

  const approverId = parsed.approverId && parsed.approverId !== target.id ? parsed.approverId : null;
  if (approverId && !(await prisma.membership.findFirst({ where: { id: approverId, orgId } }))) {
    throw new Error("Approver tidak ditemukan.");
  }

  await prisma.membership.update({
    where: { id: target.id },
    data: { role: parsed.role as OrgRole, division: parsed.division || null, approverId },
  });
  revalidatePath("/org");
}

export async function removeMember(fd: FormData) {
  const ctx = await requireManager();
  const orgId = ctx.membership.orgId;
  const target = await prisma.membership.findFirst({ where: { id: String(fd.get("membershipId") ?? ""), orgId } });
  if (!target) throw new Error("not found");
  if (target.userId === ctx.userId) throw new Error("Tidak bisa menghapus diri sendiri.");
  if (target.role === "OWNER") throw new Error("Owner tidak bisa dihapus.");
  await prisma.membership.delete({ where: { id: target.id } });
  revalidatePath("/org");
}

// useActionState wrapper so the invite form can show seat-limit / duplicate errors inline.
export async function inviteAction(_prev: { error?: string; ok?: boolean } | null, fd: FormData) {
  try {
    await createInvitation(fd);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof z.ZodError ? "Email tidak valid." : (e as Error).message };
  }
}
