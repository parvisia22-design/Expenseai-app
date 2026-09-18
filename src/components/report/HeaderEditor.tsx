"use client";
import { useState } from "react";
import { updateHeader } from "@/lib/expense/actions";

type Props = {
  reimbursementId: string;
  title: string;
  purpose: string;
  visitedPlace: string | null;
  periodStart: string; // yyyy-mm-dd
  periodEnd: string;
  editable: boolean;
};

export function HeaderEditor(p: Props) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Detail</p>
        {p.editable && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            Edit
          </button>
        )}
      </div>
    );
  }
  return (
    <form
      action={async (fd) => {
        await updateHeader(fd);
        setEditing(false);
      }}
      className="mb-4 space-y-3 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] p-4"
    >
      <input type="hidden" name="reimbursementId" value={p.reimbursementId} />
      <Field label="Judul" name="title" defaultValue={p.title} />
      <Field label="Tujuan / Purpose" name="purpose" defaultValue={p.purpose} />
      <Field label="Tempat / Visited Place" name="visitedPlace" defaultValue={p.visitedPlace ?? ""} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dari / Start" name="periodStart" type="date" defaultValue={p.periodStart} />
        <Field label="Sampai / End" name="periodEnd" type="date" defaultValue={p.periodEnd} />
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white">
          Simpan
        </button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-[var(--color-outline)] px-3 py-1.5 text-xs">
          Batal
        </button>
      </div>
    </form>
  );
}

function Field(p: { label: string; name: string; defaultValue?: string; type?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{p.label}</span>
      <input
        name={p.name}
        type={p.type ?? "text"}
        defaultValue={p.defaultValue}
        className="w-full rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-tint)]"
      />
    </label>
  );
}
