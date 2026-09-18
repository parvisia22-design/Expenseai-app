"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/scan", label: "Scan", icon: "📸" },
  { href: "/reimbursements", label: "Reports", icon: "📋" },
  { href: "/settings", label: "You", icon: "👤" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 mt-auto border-t border-[var(--color-outline)] bg-[var(--color-surface)]/95 backdrop-blur">
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map((t) => {
          const active = path === t.href || path.startsWith(t.href + "/");
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-wide ${
                  active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
