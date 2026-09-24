import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { Icon } from "@/components/ui/Icon";
import { InviteForm } from "@/components/org/InviteForm";
import { ShareInvite } from "@/components/org/ShareInvite";
import { ROLE_LABEL, can, requireOrgContext } from "@/lib/org/context";
import { BILLING_ENABLED, PAID_PLANS, PLAN_INFO, seatsEnforced } from "@/lib/org/plans";
import { rp } from "@/lib/format";
import { removeMember, revokeInvitation, updateMember, updateOrganization } from "@/lib/org/actions";
import type { OrgRole } from "@prisma/client";

const ROLE_OPTIONS: OrgRole[] = ["OWNER", "ADMIN", "APPROVER", "FINANCE", "MEMBER"];
const input = "w-full rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md";

export default async function OrgPage() {
  const ctx = await requireOrgContext();
  const { membership } = ctx;
  const org = membership.org;
  const manager = can.manage(membership.role);

  const [members, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { orgId: org.id },
      include: { user: { select: { email: true, name: true, displayName: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    manager
      ? prisma.invitation.findMany({
          where: { orgId: org.id, acceptedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const h = await headers();
  const origin = process.env.AUTH_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const nameOf = (m: (typeof members)[number]) => m.user.displayName ?? m.user.name ?? m.user.email;
  const approvers = members.filter((m) => can.approve(m.role));
  const enforced = seatsEnforced(org.plan);
  const plan = BILLING_ENABLED || org.plan === "COMPLIMENTARY"
    ? PLAN_INFO[org.plan]
    : { label: "Beta — Gratis", seats: Infinity, blurb: "Semua fitur, anggota tanpa batas selama masa beta" };
  const daysLeft = org.trialEndsAt ? Math.max(0, Math.ceil((org.trialEndsAt.getTime() - Date.now()) / 86_400_000)) : null;

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-40 space-y-4">
      <header>
        <p className="text-label-sm text-[var(--color-on-surface-variant)]">Perusahaan</p>
        <h1 className="text-headline-lg text-[var(--color-on-surface)]">{org.name}</h1>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">
          Peran Anda: <b>{ROLE_LABEL[membership.role]}</b>
        </p>
      </header>

      {/* Plan */}
      <section className="rounded-2xl bg-gradient-to-br from-[var(--color-primary-container)] to-[var(--color-tertiary)] p-5 text-white shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-label-sm uppercase tracking-wider text-white/70">Paket</p>
            <p className="text-headline-md">{plan.label}</p>
            <p className="text-body-sm text-white/80">{plan.blurb}</p>
          </div>
          <Icon name="workspace_premium" size={30} className="text-white/80" />
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-label-md text-white/85">
            <span>Anggota</span>
            <span>{enforced ? `${members.length} / ${org.seatLimit}` : members.length}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white" style={{ width: enforced ? `${Math.min(100, (members.length / org.seatLimit) * 100)}%` : "100%" }} />
          </div>
        </div>
        {BILLING_ENABLED && org.plan === "TRIAL" && daysLeft !== null && (
          <p className="mt-3 text-body-sm text-white/85">Trial berakhir dalam {daysLeft} hari. Pembayaran langganan segera tersedia.</p>
        )}
      </section>

      {/* Pricing (display only while billing is off) */}
      <details className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2">
          <Icon name="sell" size={18} className="text-[var(--color-primary)]" />
          <span className="text-headline-sm">Paket langganan</span>
          {!BILLING_ENABLED && (
            <span className="ml-auto rounded-full bg-[var(--color-secondary-container)]/60 px-2 py-0.5 text-label-sm text-[var(--color-on-secondary-container)]">Gratis selama beta</span>
          )}
        </summary>
        <ul className="mt-3 space-y-2">
          {PAID_PLANS.map((p) => {
            const info = PLAN_INFO[p];
            return (
              <li key={p} className="flex items-center justify-between rounded-xl bg-[var(--color-surface-container-low)] px-3 py-2.5">
                <div>
                  <p className="text-label-lg">{info.label}</p>
                  <p className="text-body-sm text-[var(--color-on-surface-variant)]">{info.blurb}</p>
                </div>
                <p className="text-right font-mono text-label-lg text-[var(--color-primary)]">
                  {info.priceMonthly == null ? "Hubungi kami" : <>{rp(info.priceMonthly)}<span className="block text-label-sm text-[var(--color-on-surface-variant)]">/ bulan</span></>}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-body-sm text-[var(--color-on-surface-variant)]">
          {BILLING_ENABLED ? "Upgrade segera tersedia." : "Belum ada tagihan — semua fitur gratis selama masa beta."}
        </p>
      </details>

      {/* Company settings */}
      {manager && (
        <details className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-2">
            <Icon name="tune" size={18} className="text-[var(--color-primary)]" />
            <span className="text-headline-sm">Pengaturan perusahaan</span>
          </summary>
          <form action={updateOrganization} className="mt-3 space-y-2">
            <label className="block"><span className="text-label-sm text-[var(--color-on-surface-variant)]">Nama (tampil di kop formulir)</span>
              <input name="name" defaultValue={org.name} required className={input} /></label>
            <label className="block"><span className="text-label-sm text-[var(--color-on-surface-variant)]">Alamat</span>
              <input name="address" defaultValue={org.address ?? ""} className={input} /></label>
            <label className="block"><span className="text-label-sm text-[var(--color-on-surface-variant)]">Tarif mileage (Rp / km)</span>
              <input name="mileageRatePerKm" type="number" min="0" defaultValue={org.mileageRatePerKm} className={`${input} text-right font-mono`} /></label>
            <button className="h-11 w-full rounded-xl bg-[var(--color-primary-container)] text-label-lg text-[var(--color-on-primary)]">Simpan</button>
          </form>
        </details>
      )}

      {/* Invite */}
      {manager && (
        <section className="space-y-3 rounded-2xl border border-[var(--color-outline-variant)]/25 bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Icon name="person_add" size={18} className="text-[var(--color-primary)]" />
            <h2 className="text-headline-sm">Undang anggota</h2>
          </div>
          <InviteForm />
          {invites.length > 0 && (
            <ul className="space-y-2 border-t border-[var(--color-outline-variant)]/25 pt-3">
              {invites.map((inv) => (
                <li key={inv.id} className="rounded-xl bg-[var(--color-surface-container-low)] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-label-lg">{inv.email}</p>
                      <p className="text-body-sm text-[var(--color-on-surface-variant)]">
                        {ROLE_LABEL[inv.role]} · berlaku s/d {inv.expiresAt.toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <form action={revokeInvitation}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button aria-label="Batalkan" className="p-1 text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)]">
                        <Icon name="close" size={16} />
                      </button>
                    </form>
                  </div>
                  <div className="mt-2"><ShareInvite url={`${origin}/invite/${inv.token}`} orgName={org.name} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Members */}
      <section className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="flex items-center gap-2 p-4 pb-2">
          <Icon name="groups" size={18} className="text-[var(--color-primary)]" />
          <h2 className="text-headline-sm">Anggota</h2>
          <span className="rounded-full bg-[var(--color-surface-container-high)] px-2 py-0.5 text-label-sm text-[var(--color-on-surface-variant)]">{members.length}</span>
        </div>
        <ul className="divide-y divide-[var(--color-outline-variant)]/25">
          {members.map((m) => {
            const approver = members.find((x) => x.id === m.approverId);
            return (
              <li key={m.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-fixed)] text-label-lg text-[var(--color-on-primary-fixed-variant)]">
                    {nameOf(m)[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label-lg">{nameOf(m)}{m.userId === ctx.userId ? " (Anda)" : ""}</p>
                    <p className="truncate text-body-sm text-[var(--color-on-surface-variant)]">
                      {ROLE_LABEL[m.role]}{m.division ? ` · ${m.division}` : ""}{approver ? ` · disetujui ${nameOf(approver)}` : ""}
                    </p>
                  </div>
                </div>
                {manager && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-label-sm text-[var(--color-primary)]">Atur</summary>
                    <form action={updateMember} className="mt-2 space-y-2">
                      <input type="hidden" name="membershipId" value={m.id} />
                      <div className="grid grid-cols-2 gap-2">
                        <select name="role" defaultValue={m.role} className={input}>
                          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                        </select>
                        <input name="division" defaultValue={m.division ?? ""} placeholder="Divisi" className={input} />
                      </div>
                      <label className="block">
                        <span className="text-label-sm text-[var(--color-on-surface-variant)]">Supervisor yang menyetujui</span>
                        <select name="approverId" defaultValue={m.approverId ?? ""} className={input}>
                          <option value="">Siapa saja (Supervisor/Admin)</option>
                          {approvers.filter((a) => a.id !== m.id).map((a) => (
                            <option key={a.id} value={a.id}>{nameOf(a)}</option>
                          ))}
                        </select>
                      </label>
                      <button className="h-10 w-full rounded-xl bg-[var(--color-primary-container)] text-label-md text-[var(--color-on-primary)]">Simpan</button>
                    </form>
                    {m.userId !== ctx.userId && m.role !== "OWNER" && (
                      <form action={removeMember} className="mt-2">
                        <input type="hidden" name="membershipId" value={m.id} />
                        <button className="text-label-sm text-[var(--color-error)]">Keluarkan dari perusahaan</button>
                      </form>
                    )}
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
