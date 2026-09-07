import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the auth configuration.
 *
 * Middleware runs on the Edge runtime, which has no Node built-ins — and the
 * SQL Server driver depends on `node:stream` and `node:diagnostics_channel`.
 * So anything middleware touches must be free of database imports. The
 * Credentials provider (which queries `dbo.Users`) lives in `auth.ts` and is
 * only ever loaded in the Node runtime.
 *
 * Both halves share these callbacks, so the session shape is identical
 * wherever it is read.
 */
export type Role =
  | "ADMIN"
  | "SALES_MANAGER"
  | "SALES_EXECUTIVE"
  | "TELECALLER"
  | "MARKETING"
  | "FINANCE"
  | "BROKER"
  | "SUPPORT"
  | "CUSTOMER";

export const authConfig = {
  /**
   * Both numbers have to be here as well as in auth.ts, because middleware
   * re-issues the token on every request using this config alone — leaving the
   * default here would quietly hand a twelve-hour window back on every page
   * load, whatever auth.ts says.
   *
   * `session.maxAge` is the cookie's life, `jwt.maxAge` the token's, refreshed
   * per request — so an hour untouched signs you out. Eight hours is the
   * ceiling a busy user cannot renew past; that one is enforced in auth.ts off
   * a `sat` claim stamped at sign-in, since anything refreshed per request
   * could be extended forever.
   */
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  jwt: { maxAge: 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
  providers: [], // filled in by auth.ts; middleware needs none
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    authorized({ auth: session }) {
      return Boolean(session?.user);
    },
  },
} satisfies NextAuthConfig;
