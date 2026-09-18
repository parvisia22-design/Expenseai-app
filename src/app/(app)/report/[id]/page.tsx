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
    <main className="mx-auto max-w-3xl px-4 py-8 print:py-0">
      {/* Title header (screen) */}
      <header className="mb-6 flex items-start justify-between gap-4 print:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Formulir Reimbursement Perjalanan Dinas
          </p>
          <h1 className="text-2xl font-bold tracking-tight truncate">{r.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {fmtDate(r.periodStart)}
            {r.periodStart.getTime() !== r.periodEnd.getTime() ? ` — ${fmtDate(r.periodEnd)}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      </header>

      {/* Title header (print — centered) */}
      <header className="mb-4 hidden text-center print:block">
        <h1 className="text-lg font-bold">Formulir Reimbursement Perjalanan Dinas</h1>
        <p className="text-xs text-slate-600">Business Travel Reimbursement Form</p>
      </header>

      {/* Header details */}
      <section className="mb-4 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6 print-avoid-break">
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
          <BoxedField label="Status" value={STATUS_LABEL[r.status] ?? r.status} pill />
        </div>
      </section>

      {/* Rincian Biaya */}
      <section className="mb-4 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6 print-avoid-break">
        <h2 className="mb-3 font-semibold">Rincian Biaya / Expense Detail</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-outline)] text-left text-[10px] uppercase tracking-wide text-[var(--color-ink-soft)]">
                <th className="py-2 pr-3">Expense Type</th>
                <th className="py-2 pr-3">Tanggal</th>
                <th className="py-2 pr-3">Tempat</th>
                <th className="py-2 pr-3 text-right">Unit</th>
                <th className="py-2 pr-3 text-right">Sat.</th>
                <th className="py-2 pr-3 text-right">Unit Price</th>
                <th className="py-2 pr-3 text-right">Total</th>
                <th className="py-2 print:hidden" />
              </tr>
            </thead>
            <tbody>
              {r.lines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-sm text-[var(--color-ink-soft)]">
                    Belum ada rincian.
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
              <tr>
                <td colSpan={6} className="pt-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">TOTAL</td>
                <td className="pt-3 text-right font-mono font-bold text-[var(--color-primary)]">{rp(r.totalAmount)}</td>
                <td className="print:hidden" />
              </tr>
            </tfoot>
          </table>
        </div>
        {editable && <AddLineForm reimbursementId={r.id} defaultDate={defaultDate} />}
      </section>

      {/* Terbilang */}
      <section className="mb-4 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-4 print-avoid-break">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Terbilang / Amount in Words <span className="normal-case italic text-[var(--color-primary)]">· otomatis / auto</span>
        </p>
        <p className="mt-1 text-sm italic">{terbilangRupiah(r.totalAmount)}</p>
      </section>

      {/* Lampiran — screen only, saves print space */}
      <section className="mb-4 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6 print:hidden">
        <h2 className="mb-3 font-semibold">Lampiran / Attachments</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {r.lines.flatMap((l) =>
            l.attachments.map((a) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={a.id} src={a.imageUrl} alt={l.type} className="aspect-square rounded-lg border border-[var(--color-outline)] object-cover" />
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

      {/* Signature footer — screen shows 3 columns; print shows 2 (per user's ask) */}
      <section className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6 print-avoid-break">
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
            <button className="rounded-[var(--radius-control)] border border-rose-500/50 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10">
              Hapus Formulir
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function BoxedField({ label, value, pill }: { label: string; value: string; pill?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
      {pill ? (
        <span className="inline-block rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
          {value}
        </span>
      ) : (
        <div className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm">
          {value}
        </div>
      )}
    </div>
  );
}
