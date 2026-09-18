import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-[var(--color-surface-container-low)] border border-[var(--color-outline)] p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">ExpenseAI</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">Sign in to your account</p>
        </div>

        <form
          action={async (formData) => {
            "use server";
            await signIn("nodemailer", { email: formData.get("email") as string, redirectTo: "/chat" });
          }}
          className="space-y-3"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-tint)]"
          />
          <button
            type="submit"
            className="w-full rounded-[var(--radius-control)] bg-[var(--color-primary)] py-3 text-sm font-semibold text-white hover:opacity-95"
          >
            Send magic link
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-[var(--color-ink-soft)]">
          <div className="h-px flex-1 bg-[var(--color-outline)]" />
          or
          <div className="h-px flex-1 bg-[var(--color-outline)]" />
        </div>

        <div className="space-y-2">
          <form action={async () => { "use server"; await signIn("google", { redirectTo: "/chat" }); }}>
            <button className="w-full rounded-[var(--radius-control)] border border-[var(--color-outline)] bg-[var(--color-surface)] py-3 text-sm font-semibold hover:bg-[var(--color-surface-container)]">
              Continue with Google
            </button>
          </form>
          <form action={async () => { "use server"; await signIn("apple", { redirectTo: "/chat" }); }}>
            <button className="w-full rounded-[var(--radius-control)] bg-black py-3 text-sm font-semibold text-white hover:opacity-90">
              Continue with Apple
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
