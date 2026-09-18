import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp, fmtDate } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Menunggu Supervisor",
  SUPERVISOR_APPROVED: "Menunggu Finance",
  FINANCE_APPROVED: "Disetujui",
  REIMBURSED: "Lengkap",
  REJECTED: "Ditolak",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-[var(--color-surface-container-high)] text-[var(--color-ink-soft)]",
  SUBMITTED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  SUPERVISOR_APPROVED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  FINANCE_APPROVED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  REIMBURSED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  REJECTED: "bg-rose-500/15 text-rose-600",
};

export default async function ReimbursementsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [rows, monthAgg, pendingCount, draftCount] = await Promise.all([
    prisma.reimbursement.findMany({
      where: { userId },
      include: { _count: { select: { lines: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.reimbursement.aggregate({
      where: { userId, periodStart: { gte: monthStart } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.reimbursement.count({
      where: { userId, status: { in: ["SUBMITTED", "SUPERVISOR_APPROVED"] } },
    }),
    prisma.reimbursement.count({ where: { userId, status: "DRAFT" } }),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Formulir Reimbursement</h1>
        <Link href="/chat" className="rounded-[var(--radius-control)] bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white">
          + New
        </Link>
      </header>

      {/* Monthly summary */}
      <section className="mb-6 grid grid-cols-3 gap-2">
        <Stat label="Bulan ini" value={rp(monthAgg._sum.totalAmount ?? 0)} accent />
        <Stat label="Draft" value={String(draftCount)} />
        <Stat label="Pending" value={String(pendingCount)} />
      </section>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/report/${r.id}`} className="block rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-4 hover:bg-[var(--color-surface-container)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.title}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {fmtDate(r.periodStart)}
                    {r.periodStart.getTime() !== r.periodEnd.getTime() ? ` — ${fmtDate(r.periodEnd)}` : ""}
                    {" · "}
                    {r._count.lines} rincian
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-[var(--color-primary)]">{rp(r.totalAmount)}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLOR[r.status] ?? ""}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-outline)] py-12 text-center text-sm text-[var(--color-ink-soft)]">
            Belum ada formulir. Mulai dari <Link className="text-[var(--color-primary)] font-semibold" href="/chat">chat</Link>.
          </li>
        )}
      </ul>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-[var(--radius-card)] border border-[var(--color-outline)] p-3 ${accent ? "bg-[var(--color-primary-soft)]" : "bg-[var(--color-surface-container-low)]"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
      <p className={`mt-1 truncate font-mono text-sm font-bold ${accent ? "text-[var(--color-primary)]" : ""}`}>{value}</p>
    </div>
  );
}
