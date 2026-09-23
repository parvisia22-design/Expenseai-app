import Link from "next/link";
import { BottomNav } from "@/components/nav/BottomNav";
import { Icon } from "@/components/ui/Icon";
import { OrgSwitcher } from "@/components/org/OrgSwitcher";
import { can, requireOrgContext } from "@/lib/org/context";
import { pendingApprovals } from "@/lib/org/inbox";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrgContext();
  const { membership } = ctx;
  const pending = can.review(membership.role) ? (await pendingApprovals(ctx)).length : 0;

  return (
    <>
      {/* Top app bar */}
      <header className="bg-[var(--color-surface-container-lowest)] shadow-sm sticky top-0 z-40 print:hidden">
        <div className="flex justify-between items-center max-w-md mx-auto px-4 h-16 gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary)] flex items-center justify-center text-headline-sm font-bold">
              {membership.org.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <OrgSwitcher
                active={{ id: membership.org.id, name: membership.org.name }}
                orgs={ctx.memberships.map((m) => ({ id: m.org.id, name: m.org.name }))}
              />
              <p className="text-label-sm text-[var(--color-on-surface-variant)]">expenseAI</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {can.review(membership.role) && (
              <Link
                href="/approvals"
                aria-label="Persetujuan"
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)]"
              >
                <Icon name="fact_check" size={22} />
                {pending > 0 && (
                  <span className="absolute right-0.5 top-0.5 min-w-[18px] rounded-full bg-[var(--color-error)] px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                    {pending}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/org"
              aria-label="Perusahaan"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)]"
            >
              <Icon name="apartment" size={22} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      <BottomNav />
    </>
  );
}
