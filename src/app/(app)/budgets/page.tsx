import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { upsertBudget, deleteBudget } from "@/lib/budget/actions";

export default async function BudgetsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const budgets = await prisma.budget.findMany({ where: { userId }, orderBy: { purpose: "asc" } });

  // Compute usage this month per purpose
  const usage = await prisma.reimbursement.groupBy({
    by: ["purpose"],
    where: { userId, periodStart: { gte: monthStart } },
    _sum: { totalAmount: true },
  });
  const usageMap = new Map(usage.map((u) => [u.purpose.toLowerCase(), u._sum.totalAmount ?? 0]));

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-40 space-y-4">
      <header>
        <h1 className="text-headline-lg text-[var(--color-on-surface)]">Budget</h1>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">Batas pengeluaran per tujuan (bulanan).</p>
      </header>

      <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm">
        <form action={upsertBudget} className="grid grid-cols-12 gap-2">
          <input
            name="purpose"
            required
            placeholder="Purpose (Drone, Meeting Klien…)"
            className="col-span-6 rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md"
          />
          <input
            name="amount"
            type="number"
            min="0"
            required
            placeholder="Cap Rp/bulan"
            className="col-span-4 rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md text-right font-mono"
          />
          <button className="col-span-2 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] text-label-lg">Set</button>
        </form>
      </section>

      <ul className="space-y-2">
        {budgets.length === 0 && (
          <li className="rounded-2xl border border-dashed border-[var(--color-outline-variant)]/40 py-10 text-center text-body-md text-[var(--color-on-surface-variant)]">
            Belum ada budget. Tambahkan di atas.
          </li>
        )}
        {budgets.map((b) => {
          const spent = usageMap.get(b.purpose.toLowerCase()) ?? 0;
          const pct = Math.min(100, Math.round((spent / b.amount) * 100));
          const tone = pct >= 100 ? "bg-[var(--color-error)]" : pct >= 80 ? "bg-amber-500" : "bg-[var(--color-secondary)]";
          return (
            <li key={b.id} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-label-lg text-[var(--color-on-surface)] font-semibold">{b.purpose}</p>
                  <p className="text-body-sm text-[var(--color-on-surface-variant)] mt-0.5">
                    {rp(spent)} / {rp(b.amount)} · {pct}%
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                    <div className={`h-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <form action={deleteBudget}>
                  <input type="hidden" name="id" value={b.id} />
                  <button aria-label="Delete" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] p-1">
                    <Icon name="delete" size={18} />
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
