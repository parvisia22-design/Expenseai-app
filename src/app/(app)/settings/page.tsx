import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export default async function SettingsPage() {
  const session = await auth();
  const me = await prisma.user.findUnique({ where: { id: session!.user!.id } });

  async function save(fd: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) return;
    await prisma.user.update({
      where: { id: s.user.id },
      data: {
        displayName: (fd.get("displayName") as string) || null,
        division: (fd.get("division") as string) || null,
        employeeNumber: (fd.get("employeeNumber") as string) || null,
      },
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
      <form action={save} className="space-y-3 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6">
        <Field label="Email" value={me?.email ?? ""} disabled />
        <Field label="Nama Karyawan / Staff's Name" name="displayName" defaultValue={me?.displayName ?? ""} />
        <Field label="Divisi / Division" name="division" defaultValue={me?.division ?? ""} />
        <Field label="Nomor Karyawan / Employee No." name="employeeNumber" defaultValue={me?.employeeNumber ?? ""} />
        <button className="w-full rounded-[var(--radius-control)] bg-[var(--color-primary)] py-3 text-sm font-semibold text-white">
          Simpan / Save
        </button>
      </form>

      <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
        <button className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] py-3 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-container)]">
          Sign out
        </button>
      </form>
    </main>
  );
}

function Field(p: { label: string; name?: string; defaultValue?: string; value?: string; disabled?: boolean }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{p.label}</span>
      <input
        name={p.name}
        defaultValue={p.defaultValue}
        value={p.value}
        disabled={p.disabled}
        className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-tint)] disabled:opacity-60"
      />
    </label>
  );
}
