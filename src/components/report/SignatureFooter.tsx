import { fmtDate } from "@/lib/format";

type Props = {
  submittedBy: string;
  supervisorName?: string;
  financeName?: string;
  submittedAt: Date | null;
  supervisorAt: Date | null;
  financeAt: Date | null;
  showFinance?: boolean;
};

export function SignatureFooter(p: Props) {
  const cells: Array<{
    role: string;
    person: string;
    at: Date | null;
    signed: boolean;
  }> = [
    { role: "Dibuat oleh / Submitted by", person: p.submittedBy, at: p.submittedAt, signed: !!p.submittedAt },
    { role: "Disetujui / Supervisor", person: p.supervisorName ?? "Supervisor", at: p.supervisorAt, signed: !!p.supervisorAt },
  ];
  if (p.showFinance !== false) {
    cells.push({ role: "Disetujui / Finance", person: p.financeName ?? "Finance Dept.", at: p.financeAt, signed: !!p.financeAt });
  }

  return (
    <div className={`grid gap-6 ${cells.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {cells.map((c) => (
        <div key={c.role} className="text-center">
          <p className="text-[11px] text-[var(--color-ink-soft)]">{c.role}</p>
          <div className="mt-3 flex items-center justify-center">
            <span
              className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                c.signed
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-[var(--color-surface-container-high)] text-[var(--color-ink-soft)]"
              }`}
            >
              {c.signed ? "Signed" : "Pending"}
            </span>
          </div>
          {c.at && <p className="mt-1 text-[10px] text-[var(--color-ink-soft)]">{fmtDate(c.at)}</p>}
          <div className="mt-6 border-t border-[var(--color-ink)]" />
          <p className="mt-1 text-sm font-medium">( {c.person} )</p>
        </div>
      ))}
    </div>
  );
}
