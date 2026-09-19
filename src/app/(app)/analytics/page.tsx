import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp } from "@/lib/format";
import { labelFor } from "@/lib/expense/categories";
import { Icon } from "@/components/ui/Icon";
import type { ExpenseType } from "@prisma/client";

// Category color mapping (matches Stitch palette buckets)
const CAT_COLOR: Partial<Record<ExpenseType, string>> = {
  TICKETS: "#4f46e5",
  HOTEL: "#3130c0",
  RENTAL_CAR: "#6366f1",
  TRANSPORT: "#c3c0ff",
  TOLL_PARKING: "#4edea3",
  PETROL: "#f59e0b",
  MILEAGE: "#3525cd",
  MEAL: "#10b981",
  ENTERTAINMENT: "#8b5cf6",
  EXTRA: "#94a3b8",
  OTHER: "#64748b",
};
const colorFor = (t: string) => (CAT_COLOR as Record<string, string>)[t] ?? "#64748b";

export default async function AnalyticsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [byCategory, byMonth, byMerchant, budgets] = await Promise.all([
    prisma.expenseLine.groupBy({
      by: ["type"],
      where: { userId, date: { gte: sixMonthsAgo } },
      _sum: { amount: true },
    }),
    prisma.reimbursement.findMany({
      where: { userId, periodStart: { gte: sixMonthsAgo } },
      select: { periodStart: true, totalAmount: true },
    }),
    prisma.expenseLine.findMany({
      where: { userId, date: { gte: sixMonthsAgo }, description: { not: null } },
      select: { description: true, amount: true },
      take: 500,
    }),
    prisma.budget.findMany({ where: { userId } }),
  ]);

  // Category totals
  const catTotals = byCategory
    .map((c) => ({ type: c.type, amount: c._sum.amount ?? 0 }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const catGrand = catTotals.reduce((n, c) => n + c.amount, 0);

  // Month bars
  const months: { key: string; label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: d.toLocaleDateString("id-ID", { month: "short" }), total: 0 });
  }
  for (const r of byMonth) {
    const key = `${r.periodStart.getFullYear()}-${String(r.periodStart.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.total += r.totalAmount;
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.total));

  // Top merchants
  const merchantMap = new Map<string, number>();
  for (const l of byMerchant) {
    const key = (l.description ?? "").split(" ")[0].trim();
    if (!key) continue;
    merchantMap.set(key, (merchantMap.get(key) ?? 0) + l.amount);
  }
  const topMerchants = Array.from(merchantMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-40 space-y-4">
      <header>
        <h1 className="text-headline-lg text-[var(--color-on-surface)]">Analytics</h1>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">6 bulan terakhir</p>
      </header>

      {/* Category breakdown */}
      <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="donut_small" size={18} className="text-[var(--color-primary)]" />
          <h2 className="text-headline-sm text-[var(--color-on-surface)]">Per Kategori</h2>
        </div>
        {catTotals.length === 0 ? (
          <p className="text-body-sm text-[var(--color-on-surface-variant)]">Belum ada data.</p>
        ) : (
          <>
            {/* Donut */}
            <div className="flex items-center gap-4">
              <Donut segments={catTotals.map((c) => ({ value: c.amount, color: colorFor(c.type) }))} />
              <div className="min-w-0 flex-1 space-y-1">
                {catTotals.slice(0, 6).map((c) => (
                  <div key={c.type} className="flex items-center gap-2 text-body-sm">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: colorFor(c.type) }} />
                    <span className="flex-1 truncate">{labelFor(c.type)}</span>
                    <span className="font-mono text-label-sm">{Math.round((c.amount / catGrand) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-center text-label-md text-[var(--color-on-surface-variant)]">
              Total: <span className="font-mono font-bold text-[var(--color-on-surface)]">{rp(catGrand)}</span>
            </p>
          </>
        )}
      </section>

      {/* Monthly bars */}
      <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="bar_chart" size={18} className="text-[var(--color-primary)]" />
          <h2 className="text-headline-sm text-[var(--color-on-surface)]">Per Bulan</h2>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {months.map((m) => (
            <div key={m.key} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[var(--color-primary-container)] to-[var(--color-primary-fixed-dim)]"
                  style={{ height: `${(m.total / maxMonth) * 100}%`, minHeight: m.total > 0 ? 4 : 0 }}
                  title={rp(m.total)}
                />
              </div>
              <span className="text-label-sm text-[var(--color-on-surface-variant)]">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top merchants */}
      {topMerchants.length > 0 && (
        <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="storefront" size={18} className="text-[var(--color-primary)]" />
            <h2 className="text-headline-sm text-[var(--color-on-surface)]">Top Merchant</h2>
          </div>
          <ul className="space-y-2">
            {topMerchants.map(([name, total]) => (
              <li key={name} className="flex justify-between items-center text-body-md">
                <span className="truncate">{name}</span>
                <span className="font-mono font-semibold">{rp(total)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Budget status */}
      {budgets.length > 0 && (
        <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="account_balance_wallet" size={18} className="text-[var(--color-primary)]" />
            <h2 className="text-headline-sm text-[var(--color-on-surface)]">Budget</h2>
          </div>
          <p className="text-body-sm text-[var(--color-on-surface-variant)]">
            Lihat detail di{" "}
            <a href="/budgets" className="text-[var(--color-primary)] font-semibold">/budgets</a>.
          </p>
        </section>
      )}
    </main>
  );
}

function Donut({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  const R = 42, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
      <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface-container-high)" strokeWidth="14" />
      {segments.map((s, i) => {
        const dash = (s.value / total) * C;
        const rest = C - dash;
        const rot = -90 + (acc / total) * 360;
        acc += s.value;
        return (
          <circle
            key={i}
            cx="60" cy="60" r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${rest}`}
            strokeLinecap="butt"
            transform={`rotate(${rot} 60 60)`}
          />
        );
      })}
    </svg>
  );
}
