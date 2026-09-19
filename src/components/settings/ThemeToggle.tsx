"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const t = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setTheme(t);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    if (t === "system") {
      localStorage.removeItem("theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("theme", t);
      document.documentElement.setAttribute("data-theme", t);
    }
  }

  const opts: { v: Theme; icon: string; label: string }[] = [
    { v: "light", icon: "light_mode", label: "Light" },
    { v: "dark", icon: "dark_mode", label: "Dark" },
    { v: "system", icon: "contrast", label: "System" },
  ];

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="palette" size={18} className="text-[var(--color-primary)]" />
        <h2 className="text-headline-sm text-[var(--color-on-surface)]">Tampilan</h2>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => {
          const active = theme === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => apply(o.v)}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-label-sm transition ${
                active
                  ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-sm"
                  : "bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
              }`}
            >
              <Icon name={o.icon} size={20} filled={active} />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
