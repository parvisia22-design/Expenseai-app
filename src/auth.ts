import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";

const providers: Provider[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  );
}

// Auth.js on Railway (behind a proxy) drops the pkce/state cookies mid-OAuth
// when the default `__Host-*` prefix is used, because the callback strips
// them if any header disagrees. Explicit non-prefixed cookies survive the round trip.
const useSecure = (process.env.AUTH_URL ?? "").startsWith("https://");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  trustHost: true,
  useSecureCookies: useSecure,
  pages: { signIn: "/login" },
  providers,
  cookies: {
    pkceCodeVerifier: {
      name: "authjs.pkce.code_verifier",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecure, maxAge: 900 },
    },
    state: {
      name: "authjs.state",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecure, maxAge: 900 },
    },
    nonce: {
      name: "authjs.nonce",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecure },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecure },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecure },
    },
    sessionToken: {
      name: "authjs.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecure },
    },
  },
});
