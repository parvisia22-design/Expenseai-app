"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function ShareInvite({ url, orgName }: { url: string; orgName: string }) {
  const [copied, setCopied] = useState(false);
  const wa = `https://wa.me/?text=${encodeURIComponent(`Anda diundang bergabung ke ${orgName} di expenseAI: ${url}`)}`;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="flex items-center gap-1 rounded-full bg-[var(--color-primary-fixed)] px-2.5 py-1 text-label-sm text-[var(--color-on-primary-fixed-variant)]"
      >
        <Icon name={copied ? "check" : "content_copy"} size={13} />
        {copied ? "Tersalin" : "Salin"}
      </button>
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 rounded-full bg-[var(--color-secondary-container)]/60 px-2.5 py-1 text-label-sm text-[var(--color-on-secondary-container)]"
      >
        <Icon name="share" size={13} /> WhatsApp
      </a>
    </div>
  );
}
