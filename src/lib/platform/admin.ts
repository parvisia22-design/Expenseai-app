import { notFound } from "next/navigation";
import { auth } from "@/auth";

// Platform (super) admins are the people who run expenseAI itself — not a
// company role. Granted only via the PLATFORM_ADMIN_EMAILS env var
// (comma-separated), so nobody can promote themselves from inside the app.
const adminEmails = () =>
  (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isPlatformAdmin = (email?: string | null) =>
  !!email && adminEmails().includes(email.toLowerCase());

export async function requirePlatformAdmin() {
  const s = await auth();
  // 404 rather than 403 so the panel's existence isn't advertised.
  if (!s?.user?.id || !isPlatformAdmin(s.user.email)) notFound();
  return { userId: s.user.id, email: s.user.email! };
}
