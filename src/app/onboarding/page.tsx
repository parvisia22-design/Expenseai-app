import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createOrganization } from "@/lib/org/actions";
import { Icon } from "@/components/ui/Icon";
import { ROLE_LABEL } from "@/lib/org/context";

export default async function OnboardingPage() {
  const s = await auth();
  if (!s?.user?.id) redirect("/login?callbackUrl=/onboarding");

  const [me, invites, memberships] = await Promise.all([
    prisma.user.findUnique({ where: { id: s.user.id } }),
    prisma.invitation.findMany({
      where: { email: (s.user.email ?? "").toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { org: true },
    }),
    prisma.membership.count({ where: { userId: s.user.id } }),
  ]);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-10">
      <header className="space-y-1 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)]">
          <Icon name="apartment" size={30} />
        </div>
        <h1 className="text-headline-lg text-[var(--color-on-surface)]">
          {memberships ? "Tambah perusahaan" : "Selamat datang di expenseAI"}
        </h1>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">
          Setiap perusahaan punya workspace sendiri — anggota, persetujuan, dan laporan terpisah.
        </p>
      </header>

      {invites.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary-container)]/25 p-4">
          <p className="text-label-md text-[var(--color-on-secondary-container)]">Anda diundang ke:</p>
          {invites.map((inv) => (
            <Link
              key={inv.id}
              href={`/invite/${inv.token}`}
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-container-lowest)] px-3 py-3"
            >
              <span className="text-label-lg">{inv.org.name}</span>
              <span className="text-label-sm text-[var(--color-on-surface-variant)]">{ROLE_LABEL[inv.role]} →</span>
            </Link>
          ))}
        </section>
      )}

      <form
        action={createOrganization}
        className="space-y-3 rounded-2xl border border-[var(--color-outline-variant)]/25 bg-[var(--color-surface-container-lowest)] p-5 shadow-sm"
      >
        <h2 className="text-headline-sm">Buat perusahaan baru</h2>
        <label className="block space-y-1">
          <span className="text-label-sm text-[var(--color-on-surface-variant)]">Nama perusahaan</span>
          <input
            name="name"
            required
            minLength={2}
            defaultValue={memberships ? "" : me?.companyName ?? ""}
            placeholder="PT. ORIENTAL SHEET PILING"
            className="w-full rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2.5 text-body-md"
          />
        </label>
        <button className="h-12 w-full rounded-2xl bg-[var(--color-primary-container)] text-label-lg text-[var(--color-on-primary)]">
          Buat perusahaan
        </button>
        <p className="text-center text-body-sm text-[var(--color-on-surface-variant)]">
          Anda menjadi Owner. Undang tim setelah ini.
        </p>
      </form>

      {memberships > 0 && (
        <Link href="/reimbursements" className="block text-center text-label-md text-[var(--color-on-surface-variant)]">
          ← Kembali
        </Link>
      )}
    </main>
  );
}
