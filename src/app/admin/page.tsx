import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { rp, fmtDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { requirePlatformAdmin } from "@/lib/platform/admin";
import { setOrganizationPlan } from "@/lib/platform/actions";
import { PLAN_INFO } from "@/lib/org/plans";
import type { PlanTier } from "@prisma/client";

const PLANS: PlanTier[] = ["TRIAL", "STARTER", "BUSINESS", "ENTERPRISE", "COMPLIMENTARY"];

type SP = { q?: string };

export default async function PlatformAdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requirePlatformAdmin();
  const { q = "" } = await searchParams;

  const [orgs, userCount, orgCount, claimAgg] = await Promise.all([
    prisma.organization.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : {},
      include: {
        _count: { select: { memberships: true, reimbursements: true } },
        memberships: { where: { role: "OWNER" }, include: { user: { select: { email: true } } }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.count(),
    prisma.organization.count(),
    prisma.reimbursement.aggregate({ _sum: { totalAmount: true }, _count: true }),
  ]);
  const totals = await prisma.reimbursement.groupBy({
    by: ["orgId"],
    where: { orgId: { in: orgs.map((o) => o.id) } },
    _sum: { totalAmount: true },
  });
  const totalByOrg = new Map(totals.map((t) => [t.orgId, t._sum.totalAmount ?? 0]));

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-label-sm text-[var(--color-error)]">
            <Icon name="admin_panel_settings" size={14} /> Platform admin
          </p>
          <h1 className="text-headline-lg">expenseAI — semua perusahaan</h1>
          <p className="text-body-sm text-[var(--color-on-surface-variant)]">Masuk sebagai {me.email}</p>
        </div>
        <Link href="/reimbursements" className="rounded-full border border-[var(--color-outline-variant)]/50 px-3 py-1.5 text-label-md">
          ← Kembali ke app
        </Link>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Perusahaan" value={String(orgCount)} icon="apartment" />
        <Stat label="Pengguna" value={String(userCount)} icon="group" />
        <Stat label="Klaim" value={`${claimAgg._count} · ${rp(claimAgg._sum.totalAmount ?? 0)}`} icon="receipt_long" />
      </section>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama perusahaan…"
          className="flex-1 rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-3 py-2 text-body-md"
        />
        <button className="rounded-xl bg-[var(--color-primary-container)] px-4 text-label-lg text-[var(--color-on-primary)]">Cari</button>
      </form>

      <ul className="space-y-2">
        {orgs.map((o) => (
          <li key={o.id} className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-label-lg">
                  {o.name}
                  {o.plan === "COMPLIMENTARY" && (
                    <span className="rounded-full bg-[var(--color-secondary-container)]/60 px-2 py-0.5 text-label-sm text-[var(--color-on-secondary-container)]">
                      Gratis selamanya
                    </span>
                  )}
                </p>
                <p className="text-body-sm text-[var(--color-on-surface-variant)]">
                  Owner: {o.memberships[0]?.user.email ?? "—"} · dibuat {fmtDate(o.createdAt)}
                </p>
                <p className="text-body-sm text-[var(--color-on-surface-variant)]">
                  {o._count.memberships} anggota · {o._count.reimbursements} klaim · {rp(totalByOrg.get(o.id) ?? 0)}
                </p>
              </div>
              <form action={setOrganizationPlan} className="flex items-center gap-2">
                <input type="hidden" name="orgId" value={o.id} />
                <select
                  name="plan"
                  defaultValue={o.plan}
                  className="rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-2 py-1.5 text-body-sm"
                >
                  {PLANS.map((p) => <option key={p} value={p}>{PLAN_INFO[p].label}</option>)}
                </select>
                <button className="rounded-xl bg-[var(--color-primary-container)] px-3 py-1.5 text-label-md text-[var(--color-on-primary)]">
                  Simpan
                </button>
              </form>
            </div>
          </li>
        ))}
        {orgs.length === 0 && (
          <li className="rounded-2xl border border-dashed border-[var(--color-outline-variant)]/40 p-8 text-center text-body-md text-[var(--color-on-surface-variant)]">
            Tidak ada perusahaan.
          </li>
        )}
      </ul>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-[var(--color-surface-container-lowest)] p-3 shadow-sm">
      <div className="flex items-center justify-between text-label-sm text-[var(--color-on-surface-variant)]">
        {label}
        <Icon name={icon} size={16} className="text-[var(--color-primary)]" />
      </div>
      <p className="mt-1 truncate text-label-lg">{value}</p>
    </div>
  );
}
