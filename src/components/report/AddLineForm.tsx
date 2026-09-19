"use client";
import { useState } from "react";
import { addLine } from "@/lib/expense/actions";
import { CATEGORY_OPTIONS } from "@/lib/expense/categories";

export function AddLineForm({ reimbursementId, defaultDate }: { reimbursementId: string; defaultDate: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("TICKETS");
  const suggestedUnit = CATEGORY_OPTIONS.find((c) => c.value === type)?.unit ?? "";
  const isCustom = type === "OTHER";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-lg border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary-fixed)]/40 py-2.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-fixed)]"
      >
        + Tambah kategori / Add category…
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await addLine(fd);
        setOpen(false);
      }}
      className="mt-3 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary-fixed)]/60 p-3"
    >
      <input type="hidden" name="reimbursementId" value={reimbursementId} />
      <div className="grid grid-cols-12 gap-2">
        <label className="col-span-12 sm:col-span-4">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Expense Type</span>
          <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-2 text-sm">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        {isCustom && (
          <label className="col-span-12">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Nama Kategori (custom)</span>
            <input name="customType" required placeholder="Business Brochure (sample)" className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-2 text-sm" />
          </label>
        )}
        <label className="col-span-6 sm:col-span-2">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Unit</span>
          <input name="unit" defaultValue={suggestedUnit} key={type} className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-2 text-sm" />
        </label>
        <label className="col-span-6 sm:col-span-2">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Sat.</span>
          <input name="quantity" type="number" step="0.1" min="0" placeholder="1" className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-2 text-right font-mono text-sm" />
        </label>
        <label className="col-span-6 sm:col-span-2">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Unit Price</span>
          <input name="unitPrice" type="number" min="0" className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-2 text-right font-mono text-sm" />
        </label>
        <label className="col-span-6 sm:col-span-2">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Total</span>
          <input name="amount" type="number" min="0" required placeholder="Rp" className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-2 text-right font-mono text-sm font-semibold" />
        </label>
        <label className="col-span-12 sm:col-span-4">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Tanggal</span>
          <input name="date" type="date" defaultValue={defaultDate} required className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-2 text-sm" />
        </label>
        <label className="col-span-12 sm:col-span-8">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Tempat / Description</span>
          <input name="placeText" placeholder="Kantor → Pabrik Jatake" className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-2 text-sm" />
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="rounded-lg bg-[var(--color-primary-container)] px-4 py-1.5 text-xs font-semibold text-[var(--color-on-primary)]">Tambah</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--color-outline-variant)]/40 px-4 py-1.5 text-xs">Batal</button>
      </div>
    </form>
  );
}
