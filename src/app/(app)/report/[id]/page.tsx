import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp, fmtDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { CATEGORY_META, toneClasses } from "@/lib/expense/categoryMeta";
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
import { PrintForm } from "@/components/report/PrintForm";
import { AttachmentGallery } from "@/components/report/AttachmentLightbox";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", SUBMITTED: "Menunggu Supervisor",
  SUPERVISOR_APPROVED: "Menunggu Finance", FINANCE_APPROVED: "Disetujui / Finance",
  REIMBURSED: "Lengkap / Done", REJECTED: "Ditolak",
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
  const attachmentCount = r.lines.reduce((n, l) => n + l.attachments.length, 0);

  return (
    <main className="max-w-md mx-auto px-4 pt-4 space-y-4 pb-40 print:pb-0 print:max-w-none">
      {/* Dossier Header (screen) */}
      <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-[var(--shadow-card)] border border-[var(--color-outline-variant)]/20 relative overflow-hidden print:hidden">
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-[var(--color-primary-container)]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)] text-label-sm">
            <Icon name="smart_toy" size={14} />
            Auto-Grouped by ML
          </span>
          <span className="text-label-md text-[var(--color-on-surface-variant)] flex items-center gap-1">
            <Icon name="calendar_today" size={15} />
            {fmtDate(r.periodStart)}
          </span>
        </div>
        <h1 className="text-headline-md text-[var(--color-on-surface)] tracking-tight">Project: {r.title}</h1>
        {r.visitedPlace && (
          <p className="text-body-md text-[var(--color-on-surface-variant)] flex items-center gap-1 mt-1">
            <Icon name="location_on" size={16} className="text-[var(--color-outline)]" />
            {r.visitedPlace}
          </p>
        )}
        <div className="mt-4 p-3 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 flex items-start gap-2.5">
          <Icon name="auto_awesome" size={18} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
          <p className="text-body-sm text-[var(--color-on-surface)] leading-relaxed">
            <span className="font-semibold text-[var(--color-primary)]">ML Audit:</span>{" "}
            Auto-linked {r.lines.length} expense{r.lines.length === 1 ? "" : "s"} matching purpose &ldquo;{r.purpose}&rdquo;.
          </p>
        </div>
      </section>

      {/* Excel-style print form */}
      <PrintForm
        companyName={r.user.companyName ?? ""}
        employeeName={employeeName}
        division={r.user.division ?? ""}
        visitedPlace={r.visitedPlace ?? ""}
        purpose={r.purpose}
        periodStart={r.periodStart}
        periodEnd={r.periodEnd}
        totalAmount={r.totalAmount}
        supervisorName={r.user.supervisorName ?? "Supervisor"}
        lines={r.lines.map((l) => ({
          type: l.type,
          amount: l.amount,
          quantity: l.quantity,
          unit: l.unit,
          unitPrice: l.unitPrice,
        }))}
      />

      {/* Summary Bento (Total + metrics) */}
      <section className="grid grid-cols-2 gap-3 print:hidden">
        <div className="col-span-2 bg-gradient-to-br from-[var(--color-surface-container-lowest)] to-[var(--color-surface-container-low)] p-4 rounded-2xl border border-[var(--color-outline-variant)]/25 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-label-md text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-0.5">Total Claimed</span>
            <div className="text-display-lg-m text-[var(--color-secondary)] tracking-tight">{rp(r.totalAmount)}</div>
            <span className="text-body-sm text-[var(--color-on-surface-variant)] mt-0.5 block">Est. reimbursement: 1–2 work days</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-secondary-container)]/50 text-[var(--color-on-secondary-container)] flex items-center justify-center border border-[var(--color-secondary)]/20">
            <Icon name="payments" size={26} />
          </div>
        </div>
        <MetricTile label="Dossier Size" value={`${r.lines.length} Expenses`} icon="layers" bottom={`${attachmentCount} OCR bukti`} accent="primary" />
        <MetricTile label="Status" value={STATUS_LABEL[r.status] ?? r.status} icon="verified_user" bottom={editable ? "Editable" : "Locked"} accent="secondary" />
      </section>

      {/* Header details (editable) */}
      <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm print:hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-headline-sm text-[var(--color-on-surface)]">Detail</h2>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow icon="badge" label="Nama Karyawan" value={employeeName} />
          <FieldRow icon="apartment" label="Divisi" value={r.user.division ?? "—"} />
          <FieldRow icon="place" label="Tempat" value={r.visitedPlace ?? "—"} />
          <FieldRow icon="tour" label="Tujuan" value={r.purpose} />
          <FieldRow icon="date_range" label="Jangka Waktu" value={`${fmtDate(r.periodStart)} — ${fmtDate(r.periodEnd)}`} />
        </div>
      </section>

      {/* Section header */}
      <div className="flex items-center justify-between pt-1 print:hidden">
        <div className="flex items-center gap-2">
          <h2 className="text-headline-sm text-[var(--color-on-surface)]">Bundled Expenses</h2>
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] text-label-sm">
            {r.lines.length} {r.lines.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {/* Itemized dossier list */}
      <div className="space-y-3 print:hidden">
        {r.lines.length === 0 ? (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-8 text-center border border-dashed border-[var(--color-outline-variant)]/40">
            <Icon name="inbox" size={40} className="text-[var(--color-outline)] opacity-60" />
            <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
              Belum ada rincian. Tambah dari tombol di bawah, atau drop struk di Copilot / Scanner.
            </p>
          </div>
        ) : (
          r.lines.map((l) => {
            const meta = CATEGORY_META[l.type] ?? CATEGORY_META.OTHER;
            const firstAttachment = l.attachments[0];
            return (
              <div key={l.id} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm hover:border-[var(--color-primary-fixed-dim)] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {firstAttachment ? (
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={firstAttachment.imageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 right-0 bg-[var(--color-primary)] text-[var(--color-on-primary)] p-0.5 rounded-tl">
                          <Icon name="document_scanner" size={10} className="block" />
                        </div>
                      </div>
                    ) : (
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${toneClasses[meta.tone]}`}>
                        <Icon name={meta.icon} size={22} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-label-lg text-[var(--color-on-surface)] font-semibold truncate">
                          {l.description || l.destination?.name || l.placeText || meta.label}
                        </h3>
                        {l.ocrJson != null && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[var(--color-secondary-container)]/50 text-[var(--color-on-secondary-container)] text-label-sm">
                            <Icon name="check_circle" size={11} />
                            OCR Match
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-[var(--color-on-surface-variant)] mt-0.5">
                        {meta.label}{l.mileageKm ? ` • ${l.mileageKm} km` : ""}
                        {l.unit && l.quantity ? ` • ${l.quantity} ${l.unit}` : ""}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-label-sm text-[var(--color-on-surface-variant)]">
                        <Icon name="event" size={13} />
                        <span>{iso(l.date)}</span>
                        {l.unitPrice ? (
                          <>
                            <span className="text-[var(--color-outline-variant)]">•</span>
                            <span>{rp(l.unitPrice)}/unit</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-label-lg font-bold text-[var(--color-on-surface)] block">{rp(l.amount)}</span>
                    {l.ocrJson != null && (
                      <span className="text-label-sm text-[var(--color-secondary)] font-medium">Auto</span>
                    )}
                  </div>
                </div>
                {editable && (
                  <div className="mt-3 pt-2 border-t border-[var(--color-outline-variant)]/20 flex justify-end">
                    <LineRow editable line={{
                      id: l.id, reimbursementId: r.id, date: iso(l.date), type: l.type,
                      typeLabel: meta.label, amount: l.amount, description: l.description,
                      place: l.destination?.name ?? l.placeText ?? "",
                      unit: l.unit ?? "", quantity: l.quantity, unitPrice: l.unitPrice,
                    }} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {editable && <div className="print:hidden"><AddLineForm reimbursementId={r.id} defaultDate={defaultDate} /></div>}

      {/* Terbilang */}
      <section className="bg-gradient-to-br from-[var(--color-primary-fixed)] to-[var(--color-primary-fixed)]/50 rounded-2xl p-4 border border-[var(--color-primary)]/20 shadow-sm print:hidden">
        <div className="flex items-center gap-1.5 text-[var(--color-on-primary-fixed-variant)]">
          <Icon name="auto_awesome" size={16} />
          <span className="text-label-md">Terbilang / Amount in Words · {r.terbilangOverride ? "custom" : "otomatis"}</span>
        </div>
        <p className="mt-1.5 text-body-md italic text-[var(--color-on-surface)]">{r.terbilangOverride ?? terbilangRupiah(r.totalAmount)}</p>
      </section>

      {/* Lampiran gallery */}
      {r.lines.some((l) => l.attachments.length > 0) && (
        <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm print:hidden">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="attach_file" size={18} className="text-[var(--color-primary)]" />
            <h2 className="text-headline-sm text-[var(--color-on-surface)]">Lampiran</h2>
          </div>
          <AttachmentGallery
            items={r.lines.flatMap((l) =>
              l.attachments.map((a) => ({ id: a.id, imageUrl: a.imageUrl, label: l.description ?? l.placeText ?? "" })),
            )}
          />
        </section>
      )}

      {/* Signature footer — screen only (print handled by PrintForm above) */}
      <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 border border-[var(--color-outline-variant)]/20 shadow-sm print:hidden">
        <SignatureFooter
          submittedBy={employeeName}
          submittedAt={r.submittedAt ?? r.createdAt}
          supervisorAt={r.supervisorAt}
          financeAt={r.financeAt}
          supervisorName={r.user.supervisorName ?? undefined}
          financeName={r.user.financeName ?? undefined}
          showFinance
        />
      </section>

      {/* Sticky action bar */}
      <aside className="fixed bottom-16 left-0 w-full z-40 bg-[var(--color-surface-container-lowest)]/95 backdrop-blur-lg px-4 py-3 shadow-[0px_-4px_16px_rgba(15,23,42,0.06)] border-t border-[var(--color-outline-variant)]/20 print:hidden">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <PrintButton />
          {canSubmit && (
            <form action={submit} className="flex-[2]">
              <SubmitButton />
            </form>
          )}
          {!editable && r.status !== "REIMBURSED" && r.status !== "REJECTED" && (
            <div className="flex-[2]">
              <ApprovalActions reimbursementId={r.id} status={r.status} />
            </div>
          )}
          {editable && !canSubmit && (
            <form
              action={async (fd) => { "use server"; await deleteReimbursement(fd); }}
            >
              <input type="hidden" name="reimbursementId" value={r.id} />
              <button className="h-12 rounded-2xl border border-[var(--color-error)]/50 px-4 text-label-lg text-[var(--color-error)]">
                Hapus
              </button>
            </form>
          )}
        </div>
      </aside>
    </main>
  );
}

function MetricTile({ label, value, icon, bottom, accent }: { label: string; value: string; icon: string; bottom: string; accent: "primary" | "secondary" }) {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] p-3.5 rounded-2xl border border-[var(--color-outline-variant)]/20 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-label-sm text-[var(--color-on-surface-variant)]">{label}</span>
        <Icon name={icon} size={18} className={accent === "secondary" ? "text-[var(--color-secondary)]" : "text-[var(--color-primary)]"} />
      </div>
      <div className="mt-2">
        <span className={`text-headline-sm font-bold ${accent === "secondary" ? "text-[var(--color-secondary)]" : "text-[var(--color-on-surface)]"}`}>{value}</span>
        <span className="text-label-sm text-[var(--color-on-surface-variant)] block font-medium">{bottom}</span>
      </div>
    </div>
  );
}

function FieldRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--color-surface-container-low)]">
      <Icon name={icon} size={16} className="text-[var(--color-outline)] mt-0.5" />
      <div className="min-w-0">
        <p className="text-label-sm text-[var(--color-on-surface-variant)]">{label}</p>
        <p className="text-body-md text-[var(--color-on-surface)] truncate">{value}</p>
      </div>
    </div>
  );
}

