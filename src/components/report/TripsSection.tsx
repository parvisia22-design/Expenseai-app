"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { createTrip, deleteTrip } from "@/lib/trip/actions";

type Trip = {
  id: string;
  label: string;
  visitedPlace: string | null;
  purpose: string | null;
  startDate: string;
  endDate: string;
  lineCount: number;
  totalAmount: number;
};

export function TripsSection({
  reimbursementId,
  trips,
  editable,
  defaultDate,
}: {
  reimbursementId: string;
  trips: Trip[];
  editable: boolean;
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  return (
    <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm print:hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="map" size={18} className="text-[var(--color-primary)]" />
          <h2 className="text-headline-sm text-[var(--color-on-surface)]">Trip / Sub-perjalanan</h2>
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] text-label-sm">
            {trips.length}
          </span>
        </div>
      </div>

      {trips.length === 0 ? (
        <p className="text-body-sm text-[var(--color-on-surface-variant)]">
          Belum ada sub-trip. Rincian akan langsung masuk ke formulir. Tambah trip
          untuk memecah periode (mis. &ldquo;9-12 Nov&rdquo;, &ldquo;23 Nov&rdquo;, &ldquo;24 Nov&rdquo;).
        </p>
      ) : (
        <ul className="space-y-2">
          {trips.map((t) => (
            <li key={t.id} className="rounded-xl bg-[var(--color-surface-container-low)] px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-label-lg text-[var(--color-on-surface)] font-semibold truncate">{t.label}</p>
                <p className="text-body-sm text-[var(--color-on-surface-variant)]">
                  {t.startDate}{t.startDate !== t.endDate ? ` — ${t.endDate}` : ""}
                  {t.visitedPlace ? ` · ${t.visitedPlace}` : ""}
                  {t.lineCount ? ` · ${t.lineCount} rincian` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-label-md font-bold text-[var(--color-primary)]">{rp(t.totalAmount)}</span>
                {editable && (
                  <form action={deleteTrip}>
                    <input type="hidden" name="tripId" value={t.id} />
                    <input type="hidden" name="reimbursementId" value={reimbursementId} />
                    <button aria-label="Delete" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] p-1">
                      <Icon name="delete" size={16} />
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <div className="mt-3">
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="w-full rounded-lg border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary-fixed)]/40 py-2 text-label-md text-[var(--color-primary)]"
            >
              + Tambah Trip
            </button>
          ) : (
            <form
              action={async (fd) => { await createTrip(fd); setOpen(false); }}
              className="mt-2 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary-fixed)]/60 p-3 space-y-2"
            >
              <input type="hidden" name="reimbursementId" value={reimbursementId} />
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Label</span>
                <input name="label" required placeholder="9-12 Nov" className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-1.5 text-sm" />
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Tempat</span>
                <input name="visitedPlace" placeholder="EVENT HATTI - HOTEL BIDAKARA" className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-1.5 text-sm" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Mulai</span>
                  <input name="startDate" type="date" defaultValue={defaultDate} required className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-1.5 text-sm" />
                </label>
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">Selesai</span>
                  <input name="endDate" type="date" defaultValue={defaultDate} required className="w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-2 py-1.5 text-sm" />
                </label>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-[var(--color-primary-container)] px-3 py-1.5 text-xs font-semibold text-[var(--color-on-primary)]">Tambah</button>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--color-outline-variant)]/40 px-3 py-1.5 text-xs">Batal</button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
