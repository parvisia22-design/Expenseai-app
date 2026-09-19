import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { saveProfile } from "@/lib/profile/actions";
import Link from "next/link";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { LocaleToggle } from "@/components/settings/LocaleToggle";
import { Icon } from "@/components/ui/Icon";

export default async function SettingsPage() {
  const session = await auth();
  const me = await prisma.user.findUnique({ where: { id: session!.user!.id } });

  return (
    <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
      <h1 className="text-headline-lg text-[var(--color-on-surface)]">Profil</h1>

      <ProfileForm
        action={saveProfile}
        email={me?.email ?? ""}
        displayName={me?.displayName ?? ""}
        division={me?.division ?? ""}
        employeeNumber={me?.employeeNumber ?? ""}
        companyName={me?.companyName ?? ""}
        supervisorName={me?.supervisorName ?? ""}
        financeName={me?.financeName ?? ""}
      />

      <ThemeToggle />
      <LocaleToggle />

      <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/25 shadow-sm divide-y divide-[var(--color-outline-variant)]/25">
        <SettingsLink href="/search" icon="search" title="Cari" subtitle="Lintas semua rincian" />
        <SettingsLink href="/budgets" icon="account_balance_wallet" title="Budget" subtitle="Batas pengeluaran per tujuan" />
        <SettingsLink href="/templates" icon="bookmark_add" title="Template" subtitle="Rute berulang sekali klik" />
        <SettingsLink href="/route" icon="route" title="Trip / Route" subtitle="Kalkulator jarak + toll" />
      </section>

      <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
        <button className="w-full rounded-2xl border border-[var(--color-outline-variant)]/40 py-3 text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]">
          Sign out
        </button>
      </form>
    </main>
  );
}

function SettingsLink({ href, icon, title, subtitle }: { href: string; icon: string; title: string; subtitle: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 hover:bg-[var(--color-surface-container-low)] transition">
      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)] flex items-center justify-center">
        <Icon name={icon} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-lg text-[var(--color-on-surface)]">{title}</p>
        <p className="text-body-sm text-[var(--color-on-surface-variant)]">{subtitle}</p>
      </div>
      <Icon name="chevron_right" size={18} className="text-[var(--color-outline)]" />
    </Link>
  );
}
