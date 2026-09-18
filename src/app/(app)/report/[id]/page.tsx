import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp, fmtDate } from "@/lib/format";
import { PrintButton } from "@/components/trip/PrintButton";
import { SubmitButton } from "@/components/trip/SubmitButton";
import { HeaderEditor } from "@/components/report/HeaderEditor";
import { AddLineForm } from "@/components/report/AddLineForm";
import { LineRow } from "@/components/report/LineRow";
import { deleteReimbursement } from "@/lib/expense/actions";
import { submitReimbursement } from "@/lib/expense/group";

const TYPE_LABEL: Record<string, string> = {
  MEAL: "Meal", TOLL: "Toll", PARKING: "Parking", FUEL: "BBM",
  MILEAGE: "Mileage", LODGING: "Penginapan", OTHER: "Lain-lain",
};

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

  const byType = r.lines.reduce<Record<string, number>>((m, l) => {
    m[l.type] = (m[l.type] ?? 0) + l.amount;
    return m;
  }, {});

  const canSubmit = editable && r.lines.length > 0;
  const defaultDate = iso(r.periodStart);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 print:py-0">
      <header className="mb-6 flex items-start justify-between gap-4">
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
        <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] print:hidden">
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      </header>

      {/* Header details (editable) */}
      <section className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6">
        <HeaderEditor
          reimbursementId={r.id}
          title={r.title}
          purpose={r.purpose}
          visitedPlace={r.visitedPlace}
          periodStart={iso(r.periodStart)}
          periodEnd={iso(r.periodEnd)}
          editable={editable}
        />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Row k="Nama Karyawan / Staff's Name" v={r.user.displayName ?? r.user.name ?? r.user.email} />
          <Row k="Divisi / Division" v={r.user.division ?? "—"} />
          <Row k="Tempat / Visited Place" v={r.visitedPlace ?? "—"} />
          <Row k="Tujuan / Purpose" v={r.purpose} />
          <Row k="Jangka Waktu / Time Period" v={`${fmtDate(r.periodStart)} — ${fmtDate(r.periodEnd)}`} />
          <Row k="Status" v={STATUS_LABEL[r.status] ?? r.status} />
        </dl>
      </section>

      {/* Rincian Biaya (editable) */}
      <section className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6">
        <h2 className="mb-3 font-semibold">Rincian Biaya / Expense Detail</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-outline)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                <th className="py-2 pr-3">Tanggal</th>
                <th className="py-2 pr-3">Tempat</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3 text-right">Total</th>
                <th className="py-2 pr-3 print:hidden" />
              </tr>
            </thead>
            <tbody>
              {r.lines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-[var(--color-ink-soft)]">
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
                      amount: l.amount,
                      description: l.description,
                      place: l.destination?.name ?? l.placeText ?? "",
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {editable && <AddLineForm reimbursementId={r.id} defaultDate={defaultDate} />}
      </section>

      {/* Lampiran */}
      <section className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6">
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

      {/* Total */}
      <section className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6">
        <h2 className="mb-3 font-semibold">Total Biaya Perjalanan Dinas</h2>
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(byType).map(([type, amt]) => (
              <tr key={type} className="border-b border-[var(--color-outline)] last:border-0">
                <td className="py-2 text-[var(--color-ink-soft)]">{TYPE_LABEL[type] ?? type}</td>
                <td className="py-2 text-right font-mono">{rp(amt)}</td>
              </tr>
            ))}
            <tr>
              <td className="pt-4 font-semibold">GRAND TOTAL</td>
              <td className="pt-4 text-right font-mono text-lg font-bold text-[var(--color-primary)]">{rp(r.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Alur Persetujuan */}
      <section className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6">
        <h2 className="mb-3 font-semibold">Alur Persetujuan / Approval Flow</h2>
        <ol className="grid grid-cols-3 gap-3 text-xs">
          <ApprovalStep label="Dibuat oleh" at={r.submittedAt ?? r.createdAt} done />
          <ApprovalStep label="Disetujui / Supervisor" at={r.supervisorAt} done={!!r.supervisorAt} />
          <ApprovalStep label="Disetujui / Finance" at={r.financeAt} done={!!r.financeAt} />
        </ol>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        {canSubmit && (
          <form action={submit}>
            <SubmitButton />
          </form>
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="contents">
      <dt className="text-[var(--color-ink-soft)]">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function ApprovalStep({ label, at, done }: { label: string; at: Date | null; done: boolean }) {
  return (
    <li className={`rounded-lg border p-3 text-center ${done ? "border-emerald-500/40 bg-emerald-500/5" : "border-[var(--color-outline)] bg-[var(--color-surface)]"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
      <p className="mt-1 text-xs">{at ? fmtDate(at) : "Menunggu"}</p>
    </li>
  );
}
