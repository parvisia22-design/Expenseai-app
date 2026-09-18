import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp, fmtDate } from "@/lib/format";
import { PrintButton } from "@/components/trip/PrintButton";
import { SubmitButton } from "@/components/trip/SubmitButton";
import { submitReimbursement } from "@/lib/expense/group";

const TYPE_LABEL: Record<string, string> = {
  MEAL: "Meal",
  TOLL: "Toll",
  PARKING: "Parking",
  FUEL: "BBM",
  MILEAGE: "Mileage",
  LODGING: "Penginapan",
  OTHER: "Lain-lain",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Menunggu Supervisor",
  SUPERVISOR_APPROVED: "Menunggu Finance",
  FINANCE_APPROVED: "Disetujui / Finance",
  REIMBURSED: "Lengkap / Done",
  REJECTED: "Ditolak",
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const r = await prisma.reimbursement.findFirst({
    where: { id, userId: session!.user!.id },
    include: {
      user: true,
      lines: { include: { attachments: true, origin: true, destination: true }, orderBy: { date: "asc" } },
    },
  });
  if (!r) notFound();

  async function submit() {
    "use server";
    const s = await auth();
    if (!s?.user?.id) return;
    await submitReimbursement(s.user.id, id);
  }

  const canSubmit = r.status === "DRAFT" && r.lines.length > 0;

  const byType = r.lines.reduce<Record<string, number>>((m, l) => {
    m[l.type] = (m[l.type] ?? 0) + l.amount;
    return m;
  }, {});

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 print:py-0">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Formulir Reimbursement Perjalanan Dinas
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{r.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {fmtDate(r.periodStart)}
            {r.periodStart.getTime() !== r.periodEnd.getTime() ? ` — ${fmtDate(r.periodEnd)}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] print:hidden">
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      </header>

      {/* Header details */}
      <section className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Row k="Nama Karyawan / Staff's Name" v={r.user.displayName ?? r.user.name ?? r.user.email} />
          <Row k="Divisi / Division" v={r.user.division ?? "—"} />
          <Row k="Tempat / Visited Place" v={r.visitedPlace ?? "—"} />
          <Row k="Tujuan / Purpose" v={r.purpose} />
          <Row k="Jangka Waktu / Time Period" v={`${fmtDate(r.periodStart)} — ${fmtDate(r.periodEnd)}`} />
          <Row k="Status" v={STATUS_LABEL[r.status] ?? r.status} />
        </dl>
      </section>

      {/* Rincian Biaya */}
      <section className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6">
        <h2 className="mb-3 font-semibold">Rincian Biaya / Expense Detail</h2>
        {r.lines.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">Belum ada rincian.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-outline)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <th className="py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3">Tempat</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {r.lines.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--color-outline)] last:border-0">
                    <td className="py-2 pr-3">{fmtDate(l.date)}</td>
                    <td className="py-2 pr-3">
                      {l.destination?.name ?? l.placeText ?? "—"}
                    </td>
                    <td className="py-2 pr-3">{TYPE_LABEL[l.type] ?? l.type}</td>
                    <td className="py-2 pr-3 text-right font-mono">{rp(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Total Biaya + Rekap per Kategori */}
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
      <div className="flex gap-3 print:hidden">
        {canSubmit && (
          <form action={submit}>
            <SubmitButton />
          </form>
        )}
        <PrintButton />
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
