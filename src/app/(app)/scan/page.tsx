import Link from "next/link";

export default function ScanPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Scan Struk</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Dedicated scanner is coming next. For now, drop a struk directly in the{" "}
        <Link href="/chat" className="text-[var(--color-primary)] font-semibold">chat</Link>.
      </p>
    </main>
  );
}
