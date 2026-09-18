"use client";
import { useRef, useState } from "react";

export function Composer({
  onText,
  onImage,
  disabled,
}: {
  onText: (text: string) => void;
  onImage: (file: File) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function submit() {
    const v = value.trim();
    if (!v) return;
    onText(v);
    setValue("");
  }

  return (
    <div className="border-t border-[var(--color-outline)] p-3 bg-[var(--color-surface)]">
      <div
        className="flex items-end gap-2 rounded-[var(--radius-control)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-2"
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) onImage(f);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg px-3 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
          disabled={disabled}
        >
          📎
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImage(f);
            e.target.value = "";
          }}
        />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Route, purpose, or drop a struk…"
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
