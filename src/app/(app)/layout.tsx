import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BottomNav } from "@/components/nav/BottomNav";
import { Icon } from "@/components/ui/Icon";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      {/* Top app bar */}
      <header className="bg-[var(--color-surface-container-lowest)] shadow-sm sticky top-0 z-40 print:hidden">
        <div className="flex justify-between items-center max-w-md mx-auto px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary)] flex items-center justify-center text-headline-sm font-bold border border-[var(--color-outline-variant)]/30">
              {(session.user.name ?? session.user.email ?? "?")[0]?.toUpperCase()}
            </div>
            <span className="text-headline-sm text-[var(--color-primary)] tracking-tight">expenseAI</span>
          </div>
          <button
            aria-label="Assistant"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)] transition-colors active:scale-95"
          >
            <Icon name="auto_awesome" size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      <BottomNav />
    </>
  );
}
