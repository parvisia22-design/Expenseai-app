"use client";
import { useState } from "react";
import { MessageList, type ChatMessage } from "./MessageList";
import { Composer } from "./Composer";
import { SuggestionChips } from "./SuggestionChips";
import { resizeForOCR } from "@/lib/image/resize";

export function ChatShell({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi ${userName} 👋 — Drop a struk, type a route ("Kantor → Pabrik Jatake"), or just tell me the purpose ("Drone").`,
    },
  ]);
  const [suggestions, setSuggestions] = useState<{ label: string; value: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [currentPurpose, setCurrentPurpose] = useState<string>("");

  async function handleText(text: string) {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);
    setBusy(true);
    try {
      // 1) Route?
      if (/\s(to|->|→)\s/i.test(text)) {
        const r = await fetch("/api/route-estimate", {
          method: "POST",
          body: JSON.stringify({ text }),
        }).then((res) => res.json());
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: r.distanceKm
              ? `Route saved: ${r.distanceKm} km${r.avgToll ? ` · toll ~Rp ${r.avgToll.toLocaleString("id-ID")}` : ""}${r.avgParking ? ` · parking ~Rp ${r.avgParking.toLocaleString("id-ID")}` : ""}.`
              : `Couldn't estimate: ${r.error ?? "unknown"}`,
          },
        ]);
      } else {
        // 2) Treat as purpose → remember it, ask for place suggestions
        setCurrentPurpose(text);
        const s = await fetch("/api/suggest", {
          method: "POST",
          body: JSON.stringify({ kind: "purpose", value: text }),
        }).then((res) => res.json());
        setSuggestions((s.places ?? []).map((p: { name: string; id: string }) => ({ label: p.name, value: p.id })));
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: s.places?.length
              ? `Purpose "${text}" set. Places you've paired it with — pick one, or drop a struk to attach now:`
              : `Purpose "${text}" set. Drop a struk or type "Kantor → Pabrik Jatake" to attach it.`,
          },
        ]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleImage(file: File) {
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", text: `📎 ${file.name}` },
    ]);
    setBusy(true);
    const shrunk = await resizeForOCR(file).catch(() => file);
    const fd = new FormData();
    fd.set("image", shrunk);
    if (currentPurpose) fd.set("purpose", currentPurpose);
    const res = await fetch("/api/ocr", { method: "POST", body: fd });
    const r = await res.json();
    setBusy(false);
    if (r.duplicate) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `⚠️ Duplikat: struk ini sudah pernah di-upload. Buka: /report/${r.reimbursementId}`,
        },
      ]);
      return;
    }
    if (!r.extract) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: `OCR failed: ${r.error}` },
      ]);
      return;
    }
    const total = (r.extract.total ?? 0).toLocaleString("id-ID");
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `✅ Added line: ${r.extract.category} · ${r.extract.merchant ?? "unknown"} · Rp ${total}${r.extract.date ? ` · ${r.extract.date}` : ""}. Open report: /report/${r.reimbursementId}`,
      },
    ]);
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-2xl flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-outline)]">
        <h1 className="font-bold text-lg tracking-tight">ExpenseAI</h1>
        <a href="/api/auth/signout" className="text-xs text-[var(--color-ink-soft)] hover:underline">
          Sign out
        </a>
      </header>
      <MessageList messages={messages} busy={busy} />
      {suggestions.length > 0 && (
        <SuggestionChips items={suggestions} onPick={(v) => console.log("pick", v)} />
      )}
      <Composer onText={handleText} onImage={handleImage} disabled={busy} />
    </div>
  );
}
