import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp, fmtDate } from "@/lib/format";
import { labelFor } from "@/lib/expense/categories";
import { Icon } from "@/components/ui/Icon";

type SP = { [k: string]: string | string[] | undefined };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  const userId = session!.user!.id;
  const sp = await searchParams;

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const from = typeof sp.from === "string" && sp.from ? new Date(sp.from) : null;
  const to = typeof sp.to === "string" && sp.to ? new Date(sp.to) : null;
  const min = typeof sp.min === "string" && sp.min ? parseInt(sp.min) : null;
  const max = typeof sp.max === "string" && sp.max ? parseInt(sp.max) : null;

  const results =
    q || from || to || min != null || max != null
      ? await prisma.expenseLine.findMany({
          where: {
            userId,
            ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
            ...(min != null || max != null ? { amount: { ...(min != null ? { gte: min } : {}), ...(max != null ? { lte: max } : {}) } } : {}),
            ...(q
              ? {
                  OR: [
                    { description: { contains: q, mode: "insensitive" } },
                    { placeText: { contains: q, mode: "insensitive" } },
                    { customType: { contains: q, mode: "insensitive" } },
                    { reimbursement: { title: { contains: q, mode: "insensitive" } } },
                    { reimbursement: { purpose: { contains: q, mode: "insensitive" } } },
                  ],
                }
              : {}),
          },
          include: { reimbursement: { select: { id: true, title: true, status: true } } },
          orderBy: { date: "desc" },
          take: 100,
        })
      : [];

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-40 space-y-4">
      <header>
        <h1 className="text-headline-lg text-[var(--color-on-surface)]">Cari</h1>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">Cari lintas semua rincian.</p>
      </header>

      <form method="get" className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm space-y-2">
        <label className="block">
          <span className="text-label-sm text-[var(--color-on-surface-variant)]">Merchant, tempat, tujuan</span>
          <input name="q" defaultValue={q} placeholder="GrabFood, Kantor, Drone…" className="w-full rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-label-sm text-[var(--color-on-surface-variant)]">Dari</span>
            <input type="date" name="from" defaultValue={typeof sp.from === "string" ? sp.from : ""} className="w-full rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md" />
          </label>
          <label className="block">
            <span className="text-label-sm text-[var(--color-on-surface-variant)]">Sampai</span>
            <input type="date" name="to" defaultValue={typeof sp.to === "string" ? sp.to : ""} className="w-full rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-label-sm text-[var(--color-on-surface-variant)]">Min Rp</span>
            <input type="number" name="min" defaultValue={typeof sp.min === "string" ? sp.min : ""} className="w-full rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md text-right font-mono" />
          </label>
          <label className="block">
            <span className="text-label-sm text-[var(--color-on-surface-variant)]">Max Rp</span>
            <input type="number" name="max" defaultValue={typeof sp.max === "string" ? sp.max : ""} className="w-full rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md text-right font-mono" />
          </label>
        </div>
        <button className="w-full rounded-xl bg-[var(--color-primary-container)] py-2 text-label-lg text-[var(--color-on-primary)] flex items-center justify-center gap-1">
          <Icon name="search" size={16} /> Cari
        </button>
      </form>

      <p className="text-body-sm text-[var(--color-on-surface-variant)]">{results.length} hasil</p>

      <ul className="space-y-2">
        {results.map((l) => (
          <li key={l.id}>
            <Link href={`/report/${l.reimbursement?.id ?? ""}`} className="block bg-[var(--color-surface-container-lowest)] rounded-2xl p-3 border border-[var(--color-outline-variant)]/25 shadow-sm hover:border-[var(--color-primary-fixed-dim)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-label-lg text-[var(--color-on-surface)] truncate">
                    {l.description || l.placeText || labelFor(l.type, l.customType)}
                  </p>
                  <p className="text-body-sm text-[var(--color-on-surface-variant)]">
                    {labelFor(l.type, l.customType)} · {fmtDate(l.date)}
                    {l.reimbursement?.title ? ` · ${l.reimbursement.title}` : ""}
                  </p>
                </div>
                <p className="font-mono font-bold text-[var(--color-primary)] shrink-0">{rp(l.amount)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
