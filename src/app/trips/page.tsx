import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp, fmtDate } from "@/lib/format";

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    include: { destination: true, _count: { select: { attachments: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Trips</h1>
        <Link href="/chat" className="text-sm rounded-[var(--radius-control)] bg-[var(--color-primary)] px-3 py-1.5 text-white font-semibold">
          + New
        </Link>
      </header>
      <ul className="space-y-2">
        {trips.map((t) => (
          <li key={t.id}>
            <Link href={`/report/${t.id}`} className="block rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-4 hover:bg-[var(--color-surface-container)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t.purpose}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {fmtDate(t.date)} · {t.destination?.name ?? "—"} · {t._count.attachments} attachments
                  </p>
                </div>
                <p className="font-mono text-sm font-bold text-[var(--color-primary)]">{rp(t.totalAmount)}</p>
              </div>
            </Link>
          </li>
        ))}
        {trips.length === 0 && (
          <li className="text-center text-sm text-[var(--color-ink-soft)] py-12">
            No trips yet. Start one from the chat.
          </li>
        )}
      </ul>
    </main>
  );
}
