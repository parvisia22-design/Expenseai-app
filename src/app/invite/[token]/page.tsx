import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { acceptInvitation } from "@/lib/org/actions";
import { ROLE_LABEL } from "@/lib/org/context";
import { Icon } from "@/components/ui/Icon";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [s, inv] = await Promise.all([
    auth(),
    prisma.invitation.findUnique({ where: { token }, include: { org: true } }),
  ]);

  const invalid = !inv || inv.acceptedAt || inv.expiresAt < new Date();
  const email = s?.user?.email?.toLowerCase();

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <section className="w-full space-y-4 rounded-2xl border border-[var(--color-outline-variant)]/25 bg-[var(--color-surface-container-lowest)] p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)]">
          <Icon name={invalid ? "link_off" : "group_add"} size={30} />
        </div>

        {invalid ? (
          <>
            <h1 className="text-headline-md">Undangan tidak berlaku</h1>
            <p className="text-body-md text-[var(--color-on-surface-variant)]">
              Link sudah dipakai atau kedaluwarsa. Minta admin perusahaan untuk mengirim ulang.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-headline-md">Gabung ke {inv.org.name}</h1>
            <p className="text-body-md text-[var(--color-on-surface-variant)]">
              Sebagai <b>{ROLE_LABEL[inv.role]}</b> · untuk {inv.email}
            </p>

            {!s?.user ? (
              <Link
                href={`/login?callbackUrl=/invite/${token}`}
                className="block h-12 rounded-2xl bg-[var(--color-primary-container)] text-label-lg leading-[48px] text-[var(--color-on-primary)]"
              >
                Masuk untuk bergabung
              </Link>
            ) : email !== inv.email.toLowerCase() ? (
              <div className="space-y-3">
                <p className="rounded-xl bg-[var(--color-error-container)] px-3 py-2 text-body-sm text-[var(--color-on-error-container)]">
                  Anda masuk sebagai {s.user.email}. Undangan ini untuk {inv.email}.
                </p>
                <form action={async () => { "use server"; await signOut({ redirectTo: `/login?callbackUrl=/invite/${token}` }); }}>
                  <button className="h-12 w-full rounded-2xl border border-[var(--color-outline-variant)]/50 text-label-lg">
                    Ganti akun
                  </button>
                </form>
              </div>
            ) : (
              <form action={acceptInvitation}>
                <input type="hidden" name="token" value={token} />
                <button className="h-12 w-full rounded-2xl bg-[var(--color-primary-container)] text-label-lg text-[var(--color-on-primary)]">
                  Terima undangan
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
