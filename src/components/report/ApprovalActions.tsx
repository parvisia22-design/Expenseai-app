"use client";
import { useFormStatus } from "react-dom";
import { approveFinance, approveSupervisor, markReimbursed, reopenDraft } from "@/lib/expense/actions";

function ActionButton({ label, tone = "primary" }: { label: string; tone?: "primary" | "ghost" | "success" }) {
  const { pending } = useFormStatus();
  const cls =
    tone === "success"
      ? "bg-emerald-500 text-white hover:bg-emerald-600"
      : tone === "ghost"
      ? "border border-[var(--color-outline)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-container)]"
      : "bg-[var(--color-primary)] text-white hover:opacity-95";
  return (
    <button
      disabled={pending}
      className={`rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold disabled:opacity-40 ${cls}`}
    >
      {pending ? "…" : label}
    </button>
  );
}

export function ApprovalActions({
  reimbursementId,
  status,
}: {
  reimbursementId: string;
  status: string;
}) {
  const nextAction = (() => {
    switch (status) {
      case "SUBMITTED":
        return { action: approveSupervisor, label: "Setujui sebagai Supervisor" };
      case "SUPERVISOR_APPROVED":
        return { action: approveFinance, label: "Setujui sebagai Finance" };
      case "FINANCE_APPROVED":
        return { action: markReimbursed, label: "Tandai Reimbursed" };
      default:
        return null;
    }
  })();

  if (!nextAction) return null;

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <form action={nextAction.action}>
        <input type="hidden" name="reimbursementId" value={reimbursementId} />
        <ActionButton label={nextAction.label} tone="success" />
      </form>
      <form action={reopenDraft}>
        <input type="hidden" name="reimbursementId" value={reimbursementId} />
        <ActionButton label="Buka Lagi (Reopen)" tone="ghost" />
      </form>
    </div>
  );
}
