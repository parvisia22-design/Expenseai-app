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

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-slate-500/10 text-slate-600 ring-slate-500/20",
  SUBMITTED: "bg-amber-500/15 text-amber-700 ring-amber-500/30",
  SUPERVISOR_APPROVED: "bg-amber-500/15 text-amber-700 ring-amber-500/30",
  FINANCE_APPROVED: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
  REIMBURSED: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
  REJECTED: "bg-rose-500/15 text-rose-700 ring-rose-500/30",
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
      {/* Hero */}
      <section className="mb-5 overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-[#4f46e5] via-[#5b52f0] to-[#6366f1] p-6 text-white shadow-[var(--shadow-elevated)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Bulan Ini</p>
        <p className="mt-1 font-mono text-3xl font-bold">{rp(monthAgg._sum.totalAmount ?? 0)}</p>
        <p className="mt-1 text-xs text-white/80">{monthAgg._count} formulir</p>
        <Link href="/chat" className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[var(--color-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
          + Buat Formulir Baru
        </Link>
      </section>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-2 gap-3">
        <MiniStat label="Draft" value={draftCount} accent="slate" icon="📝" />
        <MiniStat label="Menunggu" value={pendingCount} accent="amber" icon="⏳" />
      </section>

      <h2 className="section-title mb-3">Semua Formulir</h2>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/report/${r.id}`} className="card block p-4 transition hover:shadow-[var(--shadow-elevated)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
                    {fmtDate(r.periodStart)}
                    {r.periodStart.getTime() !== r.periodEnd.getTime() ? ` — ${fmtDate(r.periodEnd)}` : ""}
                    {" · "}
                    {r._count.lines} rincian
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-[var(--color-primary)]">{rp(r.totalAmount)}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_TONE[r.status] ?? ""}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="card p-10 text-center">
            <p className="mb-2 text-3xl opacity-40">📋</p>
            <p className="text-sm text-[var(--color-ink-soft)]">
              Belum ada formulir. Mulai dari <Link className="font-semibold text-[var(--color-primary)]" href="/chat">chat</Link> atau{" "}
              <Link className="font-semibold text-[var(--color-primary)]" href="/scan">scan struk</Link>.
            </p>
          </li>
        )}
      </ul>
    </main>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; accent: string; icon: string }) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
          <p className="font-mono text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
