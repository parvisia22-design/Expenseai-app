"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
    >
      {pending ? "Mengirim…" : "Simpan & Kirim ke Supervisor"}
    </button>
  );
}
