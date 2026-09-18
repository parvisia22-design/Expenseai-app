"use client";
export function SuggestionChips({
  items,
  onPick,
}: {
  items: { label: string; value: string }[];
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onPick(it.value)}
          className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:opacity-80"
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
