import { switchOrganization } from "@/lib/org/actions";
import { Icon } from "@/components/ui/Icon";

type Org = { id: string; name: string };

export function OrgSwitcher({ active, orgs }: { active: Org; orgs: Org[] }) {
  if (orgs.length <= 1) {
    return <span className="block truncate text-headline-sm text-[var(--color-primary)] tracking-tight">{active.name}</span>;
  }
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 text-headline-sm text-[var(--color-primary)] tracking-tight">
        <span className="max-w-[170px] truncate">{active.name}</span>
        <Icon name="expand_more" size={18} />
      </summary>
      <div className="absolute left-0 top-9 z-50 w-64 overflow-hidden rounded-2xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-floating)]">
        {orgs.map((o) => (
          <form key={o.id} action={switchOrganization}>
            <input type="hidden" name="orgId" value={o.id} />
            <button className="flex w-full items-center justify-between px-4 py-3 text-left text-body-md hover:bg-[var(--color-surface-container-low)]">
              <span className="truncate">{o.name}</span>
              {o.id === active.id && <Icon name="check" size={16} className="text-[var(--color-primary)]" />}
            </button>
          </form>
        ))}
        <a href="/onboarding" className="flex items-center gap-2 border-t border-[var(--color-outline-variant)]/30 px-4 py-3 text-label-md text-[var(--color-primary)]">
          <Icon name="add_business" size={16} /> Perusahaan baru
        </a>
      </div>
    </details>
  );
}
