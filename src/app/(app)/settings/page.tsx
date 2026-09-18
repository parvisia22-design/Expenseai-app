import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { saveProfile } from "@/lib/profile/actions";
import { ProfileForm } from "@/components/settings/ProfileForm";

export default async function SettingsPage() {
  const session = await auth();
  const me = await prisma.user.findUnique({ where: { id: session!.user!.id } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profil</h1>

      <ProfileForm
        action={saveProfile}
        email={me?.email ?? ""}
        displayName={me?.displayName ?? ""}
        division={me?.division ?? ""}
        employeeNumber={me?.employeeNumber ?? ""}
      />

      <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
        <button className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] py-3 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-container)]">
          Sign out
        </button>
      </form>
    </main>
  );
}
