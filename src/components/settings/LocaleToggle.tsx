import { getLocale, setLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ui/Icon";
import { revalidatePath } from "next/cache";

export async function LocaleToggle() {
  const current = await getLocale();

  async function set(locale: "id" | "en") {
    "use server";
    await setLocale(locale);
    revalidatePath("/", "layout");
  }

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="translate" size={18} className="text-[var(--color-primary)]" />
        <h2 className="text-headline-sm text-[var(--color-on-surface)]">Bahasa / Language</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {([
          { v: "id", label: "Bahasa Indonesia" },
          { v: "en", label: "English" },
        ] as const).map((o) => {
          const active = current === o.v;
          return (
            <form key={o.v} action={set.bind(null, o.v)}>
              <button
                type="submit"
                className={`w-full rounded-xl px-3 py-3 text-label-md transition ${
                  active
                    ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-sm"
                    : "bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
                }`}
              >
                {o.label}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
