import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp, fmtDate } from "@/lib/format";
import { labelFor } from "@/lib/expense/categories";
import { PrintButton } from "@/components/trip/PrintButton";
import { SubmitButton } from "@/components/trip/SubmitButton";
import { HeaderEditor } from "@/components/report/HeaderEditor";
import { AddLineForm } from "@/components/report/AddLineForm";
import { LineRow } from "@/components/report/LineRow";
import { SignatureFooter } from "@/components/report/SignatureFooter";
import { deleteReimbursement } from "@/lib/expense/actions";
import { submitReimbursement } from "@/lib/expense/group";
import { ApprovalActions } from "@/components/report/ApprovalActions";
import { terbilangRupiah } from "@/lib/format/terbilang";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Menunggu Supervisor",
  SUPERVISOR_APPROVED: "Menunggu Finance",
  FINANCE_APPROVED: "Disetujui / Finance",
  REIMBURSED: "Lengkap / Done",
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

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const r = await prisma.reimbursement.findFirst({
    where: { id, userId: session!.user!.id },
    include: {
      user: true,
      lines: { include: { attachments: true, destination: true }, orderBy: { date: "asc" } },
    },
  });
  if (!r) notFound();

  const editable = r.status === "DRAFT";

  async function submit() {
    "use server";
    const s = await auth();
    if (!s?.user?.id) return;
    await submitReimbursement(s.user.id, id);
  }

  const canSubmit = editable && r.lines.length > 0;
  const defaultDate = iso(r.periodStart);
  const employeeName = r.user.displayName ?? r.user.name ?? r.user.email;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 print:py-0">
      {/* Hero header (screen) */}
      <section className="mb-5 overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-[#4f46e5] via-[#5b52f0] to-[#6366f1] p-6 text-white shadow-[var(--shadow-elevated)] print:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
              Formulir Reimbursement Perjalanan Dinas
            </p>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight">{r.title}</h1>
            <p className="mt-2 text-sm text-white/80">
              {fmtDate(r.periodStart)}
              {r.periodStart.getTime() !== r.periodEnd.getTime() ? ` — ${fmtDate(r.periodEnd)}` : ""}
              {" · "}
              {r.lines.length} rincian
            </p>
          </div>
          <span className={`shrink-0 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/25 backdrop-blur`}>
            {STATUS_LABEL[r.status] ?? r.status}
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Grand Total</p>
            <p className="mt-0.5 font-mono text-3xl font-bold">{rp(r.totalAmount)}</p>
          </div>
          <div className="text-right text-[10px] font-semibold uppercase tracking-widest text-white/60">
            <p>{employeeName}</p>
            {r.user.division && <p className="mt-0.5 opacity-80">{r.user.division}</p>}
          </div>
        </div>
      </section>

      {/* Title header (print — centered) */}
      <header className="mb-4 hidden text-center print:block">
        <h1 className="text-lg font-bold">Formulir Reimbursement Perjalanan Dinas</h1>
        <p className="text-xs text-slate-600">Business Travel Reimbursement Form</p>
      </header>

      {/* Header details */}
      <section className="card mb-4 p-6 print-avoid-break">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Detail</h2>
          <span className={`hidden print:inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_TONE[r.status] ?? ""}`}>
            {STATUS_LABEL[r.status] ?? r.status}
          </span>
        </div>
        <HeaderEditor
          reimbursementId={r.id}
          title={r.title}
          purpose={r.purpose}
          visitedPlace={r.visitedPlace}
          periodStart={iso(r.periodStart)}
          periodEnd={iso(r.periodEnd)}
          editable={editable}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <BoxedField label="Nama Karyawan / Staff's Name" value={employeeName} />
          <BoxedField label="Divisi / Division" value={r.user.division ?? "—"} />
          <BoxedField label="Tempat yang dikunjungi / Visited Place" value={r.visitedPlace ?? "—"} />
          <BoxedField label="Tujuan / Purpose" value={r.purpose} />
          <BoxedField
            label="Jangka Waktu / Time Period"
            value={`${fmtDate(r.periodStart)} — ${fmtDate(r.periodEnd)}`}
          />
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Status</p>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_TONE[r.status] ?? ""}`}>
              {STATUS_LABEL[r.status] ?? r.status}
            </span>
          </div>
        </div>
      </section>

      {/* Rincian Biaya */}
      <section className="card mb-4 p-6 print-avoid-break">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Rincian Biaya / Expense Detail</h2>
          <span className="hidden text-xs font-semibold text-[var(--color-ink-soft)] sm:inline">
            {r.lines.length} {r.lines.length === 1 ? "row" : "rows"}
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-outline)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-outline)] bg-[var(--color-surface-container-high)]/50 text-left text-[10px] uppercase tracking-wide text-[var(--color-ink-soft)]">
                <th className="py-2.5 pl-4 pr-3">Expense Type</th>
                <th className="py-2.5 pr-3">Tanggal</th>
                <th className="py-2.5 pr-3">Tempat</th>
                <th className="py-2.5 pr-3 text-right">Unit</th>
                <th className="py-2.5 pr-3 text-right">Sat.</th>
                <th className="py-2.5 pr-3 text-right">Unit Price</th>
                <th className="py-2.5 pr-3 text-right">Total</th>
                <th className="py-2.5 pr-3 print:hidden" />
              </tr>
            </thead>
            <tbody>
              {r.lines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-[var(--color-ink-soft)]">
                    <p className="mb-2 text-2xl opacity-40">📋</p>
                    Belum ada rincian. Tambah dari tombol di bawah, atau drop struk di Chat / Scan.
                  </td>
                </tr>
              ) : (
                r.lines.map((l) => (
                  <LineRow
                    key={l.id}
                    editable={editable}
                    line={{
                      id: l.id,
                      reimbursementId: r.id,
                      date: iso(l.date),
                      type: l.type,
                      typeLabel: labelFor(l.type),
                      amount: l.amount,
                      description: l.description,
                      place: l.destination?.name ?? l.placeText ?? "",
                      unit: l.unit ?? "",
                      quantity: l.quantity,
                      unitPrice: l.unitPrice,
                    }}
                  />
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--color-surface-container-high)]/40">
                <td colSpan={6} className="py-3 pl-4 text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-soft)]">TOTAL</td>
                <td className="py-3 pr-3 text-right font-mono text-base font-bold text-[var(--color-primary)]">{rp(r.totalAmount)}</td>
                <td className="print:hidden" />
              </tr>
            </tfoot>
          </table>
        </div>
        {editable && <AddLineForm reimbursementId={r.id} defaultDate={defaultDate} />}
      </section>

      {/* Terbilang */}
      <section className="card-ai mb-4 p-5 print-avoid-break">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
          ✨ Terbilang / Amount in Words <span className="ml-1 opacity-70">· otomatis / auto</span>
        </p>
        <p className="mt-1.5 text-sm italic">{terbilangRupiah(r.totalAmount)}</p>
      </section>

      {/* Lampiran — screen only */}
      <section className="card mb-4 p-6 print:hidden">
        <h2 className="section-title mb-4">Lampiran / Attachments</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {r.lines.flatMap((l) =>
            l.attachments.map((a) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={a.id} src={a.imageUrl} alt={l.type} className="aspect-square rounded-xl border border-[var(--color-outline)] object-cover shadow-[var(--shadow-card)] transition hover:scale-[1.02]" />
            )),
          )}
          {r.lines.every((l) => l.attachments.length === 0) && (
            <p className="col-span-full text-sm text-[var(--color-ink-soft)]">Belum ada bukti pengeluaran.</p>
          )}
        </div>
      </section>

      <p className="mb-4 hidden border-t border-slate-300 pt-2 text-[10px] italic text-slate-600 print:block">
        NB : Harap Lampirkan Bukti Pengeluaran bersama Formulir ini. / Please attach expense receipts with this form.
      </p>

      {/* Signature footer */}
      <section className="card mb-6 p-6 print-avoid-break">
        <div className="print:hidden">
          <SignatureFooter
            submittedBy={employeeName}
            submittedAt={r.submittedAt ?? r.createdAt}
            supervisorAt={r.supervisorAt}
            financeAt={r.financeAt}
            showFinance
          />
        </div>
        <div className="hidden print:block">
          <SignatureFooter
            submittedBy={employeeName}
            submittedAt={r.submittedAt ?? r.createdAt}
            supervisorAt={r.supervisorAt}
            financeAt={r.financeAt}
            showFinance={false}
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        {canSubmit && (
          <form action={submit}>
            <SubmitButton />
          </form>
        )}
        {!editable && r.status !== "REIMBURSED" && r.status !== "REJECTED" && (
          <ApprovalActions reimbursementId={r.id} status={r.status} />
        )}
        <PrintButton />
        {editable && (
          <form
            action={async (fd) => {
              "use server";
              await deleteReimbursement(fd);
            }}
            className="ml-auto"
          >
            <input type="hidden" name="reimbursementId" value={r.id} />
            <button className="rounded-[var(--radius-control)] border border-rose-500/50 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10">
              Hapus Formulir
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function BoxedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
      <div className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2.5 text-sm">
        {value}
      </div>
    </div>
  );
}
