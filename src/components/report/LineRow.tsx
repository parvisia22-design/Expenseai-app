"use client";
import { useState } from "react";
import { deleteLine, updateLine } from "@/lib/expense/actions";

const rp = (n: number | null | undefined) =>
  n == null ? "—" : `Rp ${n.toLocaleString("id-ID")}`;
const num = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("id-ID");

export function LineRow({
  line,
  editable,
}: {
  line: {
    id: string;
    reimbursementId: string;
    date: string;
    type: string;
    typeLabel: string;
    amount: number;
    description: string | null;
    place: string;
    unit: string;
    quantity: number | null;
    unitPrice: number | null;
  };
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing && editable) {
    return (
      <tr>
        <td colSpan={8} className="p-2">
          <form
            action={async (fd) => {
              await updateLine(fd);
              setEditing(false);
            }}
            className="grid grid-cols-12 items-end gap-2 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] p-2 text-sm"
          >
            <input type="hidden" name="lineId" value={line.id} />
            <input type="hidden" name="reimbursementId" value={line.reimbursementId} />
            <label className="col-span-12 sm:col-span-8">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Catatan / Description</span>
              <input name="description" defaultValue={line.description ?? ""} className="w-full rounded border border-[var(--color-outline)] bg-[var(--color-surface)] px-2 py-1" />
            </label>
            <label className="col-span-8 sm:col-span-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Total (Rp)</span>
              <input name="amount" type="number" min="0" defaultValue={line.amount} className="w-full rounded border border-[var(--color-outline)] bg-[var(--color-surface)] px-2 py-1 text-right font-mono" />
            </label>
            <div className="col-span-4 sm:col-span-1 flex gap-1">
              <button className="flex-1 rounded bg-[var(--color-primary)] px-2 py-1 text-xs font-semibold text-white">✓</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded border border-[var(--color-outline)] px-2 py-1 text-xs">×</button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[var(--color-outline)] last:border-0 hover:bg-[var(--color-surface-container)]/40">
      <td className="py-2 pr-3 font-medium">{line.typeLabel}</td>
      <td className="py-2 pr-3 text-[var(--color-ink-soft)]">{line.date}</td>
      <td className="py-2 pr-3 max-w-[240px] truncate">{line.place || line.description || "—"}</td>
      <td className="py-2 pr-3 text-right text-[var(--color-ink-soft)]">{line.unit || "—"}</td>
      <td className="py-2 pr-3 text-right font-mono">{num(line.quantity)}</td>
      <td className="py-2 pr-3 text-right font-mono text-[var(--color-ink-soft)]">{rp(line.unitPrice)}</td>
      <td className="py-2 pr-3 text-right font-mono font-semibold">{rp(line.amount)}</td>
      <td className="py-2 pr-3 text-right print:hidden">
        {editable && (
          <div className="flex justify-end gap-1">
            <button onClick={() => setEditing(true)} className="rounded px-2 py-0.5 text-xs text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">
              Edit
            </button>
            <form
              action={async (fd) => {
                if (confirm("Hapus rincian ini?")) await deleteLine(fd);
              }}
            >
              <input type="hidden" name="lineId" value={line.id} />
              <input type="hidden" name="reimbursementId" value={line.reimbursementId} />
              <button className="rounded px-2 py-0.5 text-xs text-rose-500 hover:bg-rose-500/10">Hapus</button>
            </form>
          </div>
        )}
      </td>
    </tr>
  );
}
