"use client";
import { useActionState, useEffect, useRef } from "react";
import { inviteAction } from "@/lib/org/actions";

const ROLES = [
  ["MEMBER", "Karyawan"],
  ["APPROVER", "Supervisor"],
  ["FINANCE", "Finance"],
  ["ADMIN", "Admin"],
] as const;

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) formRef.current?.reset(); }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <div className="grid grid-cols-12 gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="nama@perusahaan.com"
          className="col-span-7 rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md"
        />
        <select
          name="role"
          defaultValue="MEMBER"
          className="col-span-5 rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-2 py-2 text-body-md"
        >
          {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <button
        disabled={pending}
        className="h-11 w-full rounded-xl bg-[var(--color-primary-container)] text-label-lg text-[var(--color-on-primary)] disabled:opacity-40"
      >
        {pending ? "Membuat link…" : "Buat link undangan"}
      </button>
      {state?.error && <p className="text-body-sm text-[var(--color-error)]">{state.error}</p>}
      {state?.ok && <p className="text-body-sm text-[var(--color-secondary)]">Link dibuat — bagikan dari daftar di bawah.</p>}
    </form>
  );
}
