"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const TABS = [
  { href: "/chat", label: "Copilot", icon: "chat_spark" },
  { href: "/scan", label: "Scanner", icon: "document_scanner" },
  { href: "/route", label: "Trips", icon: "route" },
  { href: "/reimbursements", label: "Reports", icon: "folder_shared" },
  { href: "/settings", label: "You", icon: "account_circle" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-[var(--color-surface-container-lowest)]/90 backdrop-blur-md border-t border-[var(--color-outline-variant)]/30 shadow-[var(--shadow-nav-up)] print:hidden">
      {TABS.map((t) => {
        const active = path === t.href || path.startsWith(t.href + "/");
        return active ? (
          <Link
            key={t.href}
            href={t.href}
            className="flex flex-col items-center justify-center bg-[var(--color-primary-container)] text-[var(--color-on-primary)] rounded-full px-4 py-1.5 transition-all active:scale-95 shadow-sm"
          >
            <Icon name={t.icon} size={22} filled />
            <span className="text-label-sm mt-0.5 font-bold">{t.label}</span>
          </Link>
        ) : (
          <Link
            key={t.href}
            href={t.href}
            className="flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] px-3 py-1.5 hover:text-[var(--color-primary)] transition-colors active:scale-95"
          >
            <Icon name={t.icon} size={22} />
            <span className="text-label-sm mt-0.5">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
