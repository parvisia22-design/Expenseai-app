"use client";
import { useState, useTransition } from "react";

type Props = {
  action: (fd: FormData) => Promise<void>;
  email: string;
  displayName: string;
  division: string;
  employeeNumber: string;
};

export function ProfileForm(p: Props) {
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await p.action(fd);
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        });
      }}
      className="space-y-3 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] p-6"
    >
      <Field label="Email" value={p.email} disabled />
      <Field label="Nama Karyawan / Staff's Name" name="displayName" defaultValue={p.displayName} />
      <Field label="Divisi / Division" name="division" defaultValue={p.division} />
      <Field label="Nomor Karyawan / Employee No." name="employeeNumber" defaultValue={p.employeeNumber} />
      <button
        disabled={pending}
        className="w-full rounded-[var(--radius-control)] bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? "Menyimpan…" : saved ? "✓ Tersimpan" : "Simpan / Save"}
      </button>
    </form>
  );
}

function Field(p: { label: string; name?: string; defaultValue?: string; value?: string; disabled?: boolean }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{p.label}</span>
      <input
        name={p.name}
        defaultValue={p.defaultValue}
        value={p.value}
        disabled={p.disabled}
        readOnly={p.disabled}
        className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-tint)] disabled:opacity-60"
      />
    </label>
  );
}
