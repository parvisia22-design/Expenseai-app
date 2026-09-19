"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Att = { id: string; imageUrl: string; label?: string };

export function AttachmentGallery({ items }: { items: Att[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? null : Math.min(items.length - 1, i + 1)));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? null : Math.max(0, i - 1)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  if (items.length === 0) {
    return <p className="text-body-sm text-[var(--color-on-surface-variant)]">Belum ada bukti pengeluaran.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {items.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setOpen(i)}
            className="relative aspect-square overflow-hidden rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container)] shadow-sm transition hover:scale-[1.02] hover:border-[var(--color-primary-fixed-dim)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.imageUrl} alt={a.label ?? ""} className="h-full w-full object-cover" />
            <div className="absolute bottom-0 right-0 bg-[var(--color-primary)] text-[var(--color-on-primary)] p-1 rounded-tl-lg">
              <Icon name="zoom_in" size={12} />
            </div>
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setOpen(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(null); }}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
          >
            <Icon name="close" size={22} />
          </button>

          {open > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen((i) => (i === null ? null : Math.max(0, i - 1))); }}
              aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            >
              <Icon name="chevron_left" size={26} />
            </button>
          )}
          {open < items.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen((i) => (i === null ? null : Math.min(items.length - 1, i + 1))); }}
              aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            >
              <Icon name="chevron_right" size={26} />
            </button>
          )}

          <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={items[open].imageUrl} alt="" className="max-h-[85vh] max-w-[95vw] rounded-xl shadow-2xl" />
            {items[open].label && (
              <p className="mt-3 text-center text-xs text-white/80">{items[open].label}</p>
            )}
            <p className="mt-1 text-center text-[10px] text-white/40">{open + 1} / {items.length}</p>
          </div>
        </div>
      )}
    </>
  );
}
