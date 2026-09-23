import Link from "next/link";
import { redirect } from "next/navigation";
import { rp, fmtDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { can, requireOrgContext } from "@/lib/org/context";
import { pendingApprovals } from "@/lib/org/inbox";

const STEP: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: "Perlu persetujuan Supervisor", tone: "bg-amber-500/15 text-amber-700" },
  SUPERVISOR_APPROVED: { label: "Perlu persetujuan Finance", tone: "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]" },
  FINANCE_APPROVED: { label: "Siap dibayar", tone: "bg-[var(--color-secondary-container)]/60 text-[var(--color-on-secondary-container)]" },
};

export default async function ApprovalsPage() {
  const ctx = await requireOrgContext();
  if (!can.review(ctx.membership.role)) redirect("/reimbursements");
  const items = await pendingApprovals(ctx);
  const total = items.reduce((n, x) => n + x.r.totalAmount, 0);

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-40 space-y-4">
      <header>
        <h1 className="text-headline-lg text-[var(--color-on-surface)]">Persetujuan</h1>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">
          {items.length} formulir menunggu Anda · {rp(total)}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-outline-variant)]/40 p-10 text-center">
          <Icon name="task_alt" size={40} className="text-[var(--color-secondary)]" />
          <p className="mt-2 text-body-md text-[var(--color-on-surface-variant)]">Semua sudah beres.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map(({ r, division }) => {
            const step = STEP[r.status];
            const who = r.user.displayName ?? r.user.name ?? r.user.email;
            return (
              <li key={r.id}>
                <Link
                  href={`/report/${r.id}`}
                  className="block rounded-2xl border border-[var(--color-outline-variant)]/25 bg-[var(--color-surface-container-lowest)] p-4 shadow-sm hover:border-[var(--color-primary-fixed-dim)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-label-lg">{who}</p>
                      <p className="truncate text-body-sm text-[var(--color-on-surface-variant)]">
                        {r.title}{division ? ` · ${division}` : ""}
                      </p>
                      <p className="mt-1 text-label-sm text-[var(--color-on-surface-variant)]">
                        {r._count.lines} rincian · dikirim {r.submittedAt ? fmtDate(r.submittedAt) : "—"}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-label-lg font-bold text-[var(--color-primary)]">{rp(r.totalAmount)}</p>
                  </div>
                  <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-label-sm ${step?.tone ?? ""}`}>{step?.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
