"use client";
import { useState } from "react";
import { deleteLine, updateLine } from "@/lib/expense/actions";

const TYPE_LABEL: Record<string, string> = {
  MEAL: "Meal", TOLL: "Toll", PARKING: "Parking", FUEL: "BBM",
  MILEAGE: "Mileage", LODGING: "Penginapan", OTHER: "Lain-lain",
};

const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function LineRow({
  line,
  editable,
}: {
  line: {
    id: string;
    reimbursementId: string;
    date: string;
    type: string;
    amount: number;
    description: string | null;
    place: string;
  };
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing && editable) {
    return (
      <tr>
        <td colSpan={5} className="p-2">
          <form
            action={async (fd) => {
              await updateLine(fd);
              setEditing(false);
            }}
            className="grid grid-cols-2 items-end gap-2 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] p-2 text-sm sm:grid-cols-6"
          >
            <input type="hidden" name="lineId" value={line.id} />
            <input type="hidden" name="reimbursementId" value={line.reimbursementId} />
            <div className="sm:col-span-3">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Catatan</label>
              <input name="description" defaultValue={line.description ?? ""} className="w-full rounded border border-[var(--color-outline)] bg-[var(--color-surface)] px-2 py-1" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Rp</label>
              <input name="amount" type="number" min="0" defaultValue={line.amount} className="w-full rounded border border-[var(--color-outline)] bg-[var(--color-surface)] px-2 py-1 text-right font-mono" />
            </div>
            <div className="flex gap-1">
              <button className="rounded bg-[var(--color-primary)] px-2 py-1 text-xs font-semibold text-white">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded border border-[var(--color-outline)] px-2 py-1 text-xs">×</button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[var(--color-outline)] last:border-0">
      <td className="py-2 pr-3">{line.date}</td>
      <td className="py-2 pr-3">{line.place || "—"}</td>
      <td className="py-2 pr-3">{TYPE_LABEL[line.type] ?? line.type}</td>
      <td className="py-2 pr-3 text-right font-mono">{rp(line.amount)}</td>
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
