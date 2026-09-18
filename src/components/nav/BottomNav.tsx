"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/scan", label: "Scan", icon: "📸" },
  { href: "/route", label: "Route", icon: "🗺️" },
  { href: "/reimbursements", label: "Reports", icon: "📋" },
  { href: "/settings", label: "You", icon: "👤" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 mt-auto border-t border-[var(--color-outline)] bg-[var(--color-surface-container-low)]/90 backdrop-blur-xl print:hidden">
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map((t) => {
          const active = path === t.href || path.startsWith(t.href + "/");
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                  active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`}
              >
                {active && (
                  <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-tint)]" />
                )}
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
