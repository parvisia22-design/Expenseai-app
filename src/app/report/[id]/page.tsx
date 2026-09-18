import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp, fmtDate } from "@/lib/format";
import { PrintButton } from "@/components/trip/PrintButton";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { id, userId: session.user.id },
    include: { origin: true, destination: true, attachments: true, user: true },
  });
  if (!trip) notFound();

  const byType = (t: string) => trip.attachments.filter((a) => a.type === t);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 print:py-0">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Business Travel Reimbursement</h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          {trip.user.name ?? trip.user.email} · {fmtDate(trip.date)} · {trip.purpose}
        </p>
      </header>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6 mb-6">
        <h2 className="font-semibold mb-4">Trip</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-[var(--color-ink-soft)]">Tanggal</dt>
          <dd>{fmtDate(trip.date)}</dd>
          <dt className="text-[var(--color-ink-soft)]">Tujuan / Purpose</dt>
          <dd>{trip.purpose}</dd>
          <dt className="text-[var(--color-ink-soft)]">Origin</dt>
          <dd>{trip.origin?.name ?? "—"}</dd>
          <dt className="text-[var(--color-ink-soft)]">Destination</dt>
          <dd>{trip.destination?.name ?? "—"}</dd>
          <dt className="text-[var(--color-ink-soft)]">Mileage</dt>
          <dd>{trip.mileageKm ? `${trip.mileageKm} km` : "—"}</dd>
        </dl>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6 mb-6">
        <h2 className="font-semibold mb-4">Lampiran / Attachments</h2>
        {trip.attachments.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">No attachments yet.</p>
        ) : (
          <ul className="space-y-3">
            {trip.attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-outline)] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imageUrl} alt={a.type} className="h-16 w-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{a.type}</p>
                  <p className="text-sm">{rp(a.amount)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6">
        <h2 className="font-semibold mb-4">Total Biaya Perjalanan Dinas</h2>
        <table className="w-full text-sm">
          <tbody>
            {[
              ["Meal", trip.mealAmount, byType("RECEIPT").length],
              ["Toll", trip.tollAmount, byType("TOLL").length],
              ["Parking", trip.parkingAmount, byType("PARKING").length],
              ["Other", trip.otherAmount, byType("OTHER").length],
            ].map(([label, amt, n]) => (
              <tr key={label as string} className="border-b border-[var(--color-outline)] last:border-0">
                <td className="py-2 text-[var(--color-ink-soft)]">{label as string} <span className="text-xs opacity-60">({n as number})</span></td>
                <td className="py-2 text-right font-mono">{rp(amt as number)}</td>
              </tr>
            ))}
            <tr>
              <td className="pt-4 font-semibold">Total</td>
              <td className="pt-4 text-right font-mono text-lg font-bold text-[var(--color-primary)]">{rp(trip.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="mt-6 flex gap-3 print:hidden">
        <a href="/chat" className="text-sm text-[var(--color-ink-soft)] hover:underline">← Back to chat</a>
        <PrintButton />
      </div>
    </main>
  );
}
