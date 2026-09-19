import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { saveProfile } from "@/lib/profile/actions";
import { ProfileForm } from "@/components/settings/ProfileForm";

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

      <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
        <button className="w-full rounded-2xl border border-[var(--color-outline-variant)]/40 py-3 text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]">
          Sign out
        </button>
      </form>
    </main>
  );
}
