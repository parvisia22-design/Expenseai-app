"use client";
export type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

export function MessageList({ messages, busy }: { messages: ChatMessage[]; busy: boolean }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
      {messages.map((m) => (
        <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
          <div
            className={
              m.role === "user"
                ? "max-w-[85%] rounded-2xl rounded-br-md bg-[var(--color-ink)] text-[var(--color-surface)] px-4 py-2.5 text-sm"
                : "max-w-[85%] rounded-2xl rounded-bl-md bg-[var(--color-surface-container-low)] border border-[var(--color-outline)] px-4 py-2.5 text-sm"
            }
          >
            {m.text}
          </div>
        </div>
      ))}
      {busy && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] px-4 py-2 text-xs">
            thinking…
          </div>
        </div>
      )}
    </div>
  );
}
