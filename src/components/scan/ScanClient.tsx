"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { resizeForOCR } from "@/lib/image/resize";

type Extract = {
  merchant: string | null;
  date: string | null;
  total: number | null;
  category: string;
};
type Result = { extract: Extract; reimbursementId: string; imageUrl: string; lineId: string };

export function ScanClient({ suggestedPurpose }: { suggestedPurpose: string }) {
  const [purpose, setPurpose] = useState(suggestedPurpose);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setError(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const shrunk = await resizeForOCR(file).catch(() => file);
      const fd = new FormData();
      fd.set("image", shrunk);
      fd.set("purpose", purpose.trim() || "Uncategorized");
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "OCR failed");
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6 space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Scan Struk</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Take a photo — Claude reads merchant, total, and date, then adds it to your open reimbursement.
        </p>
      </header>

      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Tujuan / Purpose (this scan)
        </span>
        <input
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Drone, Meeting Klien, dll."
          className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-tint)]"
        />
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-[var(--radius-control)] bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          📸 Ambil Foto
        </button>
        <button
          onClick={() => {
            const el = document.createElement("input");
            el.type = "file";
            el.accept = "image/*";
            el.onchange = () => {
              const f = el.files?.[0];
              if (f) onFile(f);
            };
            el.click();
          }}
          disabled={busy}
          className="rounded-[var(--radius-control)] border border-[var(--color-outline)] py-4 text-sm font-semibold hover:bg-[var(--color-surface-container)] disabled:opacity-40"
        >
          📎 Dari Galeri
        </button>
      </div>

      {preview && (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-outline)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full max-h-[60vh] object-contain bg-black/5" />
        </div>
      )}

      {busy && (
        <div className="rounded-[var(--radius-card)] bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--color-primary)]">
          Membaca struk…
        </div>
      )}

      {error && (
        <div className="rounded-[var(--radius-card)] border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-[var(--radius-card)] border border-emerald-500/40 bg-emerald-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">✅ Ditambahkan</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-[var(--color-ink-soft)]">Merchant</dt>
            <dd className="font-medium">{result.extract.merchant ?? "—"}</dd>
            <dt className="text-[var(--color-ink-soft)]">Kategori</dt>
            <dd className="font-medium">{result.extract.category}</dd>
            <dt className="text-[var(--color-ink-soft)]">Tanggal</dt>
            <dd className="font-medium">{result.extract.date ?? "—"}</dd>
            <dt className="text-[var(--color-ink-soft)]">Total</dt>
            <dd className="font-mono font-semibold">
              Rp {(result.extract.total ?? 0).toLocaleString("id-ID")}
            </dd>
          </dl>
          <div className="flex gap-2">
            <Link
              href={`/report/${result.reimbursementId}`}
              className="flex-1 rounded-[var(--radius-control)] bg-[var(--color-primary)] py-2 text-center text-sm font-semibold text-white"
            >
              Buka Report
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setPreview(null);
              }}
              className="flex-1 rounded-[var(--radius-control)] border border-[var(--color-outline)] py-2 text-sm font-semibold"
            >
              Scan Lagi
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
