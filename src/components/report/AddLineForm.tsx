"use client";
import { useState } from "react";
import { addLine } from "@/lib/expense/actions";

const TYPES = [
  ["MEAL", "Meal"],
  ["TOLL", "Toll"],
  ["PARKING", "Parking"],
  ["FUEL", "BBM"],
  ["MILEAGE", "Mileage"],
  ["LODGING", "Penginapan"],
  ["OTHER", "Lain-lain"],
] as const;

export function AddLineForm({ reimbursementId, defaultDate }: { reimbursementId: string; defaultDate: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-lg border border-dashed border-[var(--color-outline)] py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
      >
        + Tambah Rincian
      </button>
    );
  }
  return (
    <form
      action={async (fd) => {
        await addLine(fd);
        setOpen(false);
      }}
      className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] p-3 sm:grid-cols-6"
    >
      <input type="hidden" name="reimbursementId" value={reimbursementId} />
      <input name="date" type="date" defaultValue={defaultDate} required className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface)] px-2 py-1.5 text-sm sm:col-span-2" />
      <select name="type" defaultValue="MEAL" className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface)] px-2 py-1.5 text-sm">
        {TYPES.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <input name="placeText" placeholder="Tempat" className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface)] px-2 py-1.5 text-sm" />
      <input name="amount" type="number" min="0" placeholder="Rp" required className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-right font-mono" />
      <div className="flex gap-2 sm:col-span-6">
        <button className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white">Tambah</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--color-outline)] px-3 py-1.5 text-xs">Batal</button>
      </div>
    </form>
  );
}
