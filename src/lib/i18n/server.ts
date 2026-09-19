import { cookies } from "next/headers";
import type { Locale } from "./dict";

const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  return v === "en" ? "en" : "id";
}

export async function setLocale(locale: Locale) {
  "use server";
  const c = await cookies();
  c.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
