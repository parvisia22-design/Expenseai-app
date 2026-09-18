"use client";
import { useState } from "react";
import Link from "next/link";

type Estimate = {
  source: "preset" | "google";
  distanceKm: number;
  avgToll?: number;
  avgParking?: number;
  durationMin?: number;
  originResolved?: string;
  destResolved?: string;
};

type Draft = { id: string; title: string; purpose: string };

export function RouteClient({ drafts, hasMapsKey }: { drafts: Draft[]; hasMapsKey: boolean }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState(drafts[0]?.purpose ?? "");
  const [distanceKm, setDistanceKm] = useState<string>("");
  const [tollAmount, setTollAmount] = useState<string>("");
  const [parkingAmount, setParkingAmount] = useState<string>("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ reimbursementId: string } | null>(null);

  async function fetchEstimate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/route-estimate", {
        method: "POST",
        body: JSON.stringify({ text: `${origin} → ${destination}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "estimate failed");
      setEstimate(data);
      setDistanceKm(String(data.distanceKm ?? ""));
      if (data.avgToll != null) setTollAmount(String(data.avgToll));
      if (data.avgParking != null) setParkingAmount(String(data.avgParking));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveRoute() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/route/save", {
        method: "POST",
        body: JSON.stringify({
          purpose: purpose || "Perjalanan",
          origin,
          destination,
          distanceKm: parseFloat(distanceKm) || 0,
          tollAmount: parseInt(tollAmount) || 0,
          parkingAmount: parseInt(parkingAmount) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "save failed");
      setSaved({ reimbursementId: data.reimbursementId });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6 space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Rute Perjalanan</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Isi origin → destination. {hasMapsKey ? "Google Maps akan hitung jarak otomatis." : "Isi jarak manual (Google Maps key belum di-set)."}
        </p>
      </header>

      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Dari</span>
          <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Kantor" className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm" />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Ke</span>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Pabrik Jatake" className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm" />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Tujuan / Purpose</span>
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} list="draft-purposes" placeholder="Drone, Meeting Klien…" className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm" />
          <datalist id="draft-purposes">
            {drafts.map((d) => (
              <option key={d.id} value={d.purpose} />
            ))}
          </datalist>
        </label>
      </div>

      {hasMapsKey && (
        <button onClick={fetchEstimate} disabled={busy || !origin || !destination} className="w-full rounded-[var(--radius-control)] border border-[var(--color-primary)] bg-[var(--color-primary-soft)] py-2.5 text-sm font-semibold text-[var(--color-primary)] disabled:opacity-40">
          {busy ? "Menghitung…" : "🗺️ Hitung Jarak"}
        </button>
      )}

      {estimate && (
        <p className="text-xs text-[var(--color-ink-soft)]">
          {estimate.source === "preset" ? "Dari preset lokal Anda" : `Google Maps → ${estimate.originResolved} → ${estimate.destResolved}${estimate.durationMin ? ` (~${estimate.durationMin} min)` : ""}`}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <NumField label="Jarak (km)" value={distanceKm} onChange={setDistanceKm} step="0.1" />
        <NumField label="Tol (Rp)" value={tollAmount} onChange={setTollAmount} />
        <NumField label="Parkir (Rp)" value={parkingAmount} onChange={setParkingAmount} />
      </div>

      {error && (
        <div className="rounded-[var(--radius-card)] border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</div>
      )}

      {saved ? (
        <div className="space-y-3 rounded-[var(--radius-card)] border border-emerald-500/40 bg-emerald-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">✅ Rute tersimpan</p>
          <div className="flex gap-2">
            <Link href={`/report/${saved.reimbursementId}`} className="flex-1 rounded-[var(--radius-control)] bg-[var(--color-primary)] py-2 text-center text-sm font-semibold text-white">Buka Report</Link>
            <button onClick={() => { setSaved(null); setDistanceKm(""); setTollAmount(""); setParkingAmount(""); setOrigin(""); setDestination(""); setEstimate(null); }} className="flex-1 rounded-[var(--radius-control)] border border-[var(--color-outline)] py-2 text-sm font-semibold">Rute Lain</button>
          </div>
        </div>
      ) : (
        <button onClick={saveRoute} disabled={busy || !origin || !destination || (!distanceKm && !tollAmount && !parkingAmount)} className="w-full rounded-[var(--radius-control)] bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-40">
          {busy ? "Menyimpan…" : "Simpan ke Reimbursement"}
        </button>
      )}
    </main>
  );
}

function NumField({ label, value, onChange, step }: { label: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</span>
      <input type="number" min="0" step={step ?? "1"} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-2 py-2 text-right font-mono text-sm" />
    </label>
  );
}
