"use client";
import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";

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
      className="space-y-4"
    >
      <Section title="Anda" icon="person">
        <Field label="Email" value={p.email} disabled />
        <Field label="Nama Karyawan / Staff's Name" name="displayName" defaultValue={p.displayName} />
        <Field label="Divisi / Division" name="division" defaultValue={p.division} />
        <Field label="Nomor Karyawan / Employee No." name="employeeNumber" defaultValue={p.employeeNumber} />
      </Section>

      <button
        disabled={pending}
        className="w-full rounded-2xl bg-[var(--color-primary-container)] py-3 text-label-lg text-[var(--color-on-primary)] disabled:opacity-40 shadow-sm"
      >
        {pending ? "Menyimpan…" : saved ? "✓ Tersimpan" : "Simpan / Save"}
      </button>
    </form>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Icon name={icon} size={18} className="text-[var(--color-primary)]" />
        <h2 className="text-headline-sm text-[var(--color-on-surface)]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field(p: { label: string; name?: string; defaultValue?: string; value?: string; disabled?: boolean; placeholder?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-label-sm text-[var(--color-on-surface-variant)]">{p.label}</span>
      <input
        name={p.name}
        defaultValue={p.defaultValue}
        value={p.value}
        disabled={p.disabled}
        readOnly={p.disabled}
        placeholder={p.placeholder}
        className="w-full rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 disabled:opacity-60"
      />
    </label>
  );
}
