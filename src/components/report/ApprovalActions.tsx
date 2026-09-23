"use client";
import { useFormStatus } from "react-dom";
import {
  approveFinance, approveSupervisor, markReimbursed, rejectReimbursement, reopenDraft,
} from "@/lib/expense/actions";
import type { ApprovalPerms } from "@/lib/org/approval";

function ActionButton({ label, tone }: { label: string; tone: "success" | "ghost" | "danger" }) {
  const { pending } = useFormStatus();
  const cls = {
    success: "bg-[var(--color-secondary)] text-white",
    ghost: "border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface-variant)]",
    danger: "bg-[var(--color-error)] text-white",
  }[tone];
  return (
    <button disabled={pending} className={`h-12 w-full rounded-2xl px-4 text-label-lg disabled:opacity-40 ${cls}`}>
      {pending ? "…" : label}
    </button>
  );
}

export function ApprovalActions({ reimbursementId, perms }: { reimbursementId: string; perms: ApprovalPerms }) {
  const primary = perms.canSupervise
    ? { action: approveSupervisor, label: "Setujui (Supervisor)" }
    : perms.canFinance
      ? { action: approveFinance, label: "Setujui (Finance)" }
      : perms.canMarkPaid
        ? { action: markReimbursed, label: "Tandai Sudah Dibayar" }
        : null;

  return (
    <div className="flex w-full items-center gap-2">
      {primary && (
        <form action={primary.action} className="flex-[2]">
          <input type="hidden" name="reimbursementId" value={reimbursementId} />
          <ActionButton label={primary.label} tone="success" />
        </form>
      )}
      {perms.canReject && (
        <details className="relative flex-1">
          <summary className="flex h-12 cursor-pointer list-none items-center justify-center rounded-2xl border border-[var(--color-error)]/50 text-label-lg text-[var(--color-error)]">
            Tolak
          </summary>
          <form
            action={rejectReimbursement}
            className="absolute bottom-14 right-0 w-72 space-y-2 rounded-2xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] p-3 shadow-[var(--shadow-floating)]"
          >
            <input type="hidden" name="reimbursementId" value={reimbursementId} />
            <textarea
              name="reason"
              required
              rows={3}
              placeholder="Alasan penolakan (mis. struk parkir kurang)"
              className="w-full rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md"
            />
            <ActionButton label="Kirim Penolakan" tone="danger" />
          </form>
        </details>
      )}
      {perms.canReopen && (
        <form action={reopenDraft} className="flex-1">
          <input type="hidden" name="reimbursementId" value={reimbursementId} />
          <ActionButton label="Tarik & Edit" tone="ghost" />
        </form>
      )}
    </div>
  );
}
