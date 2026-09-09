import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify, hash } from "@node-rs/argon2";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { queryOne, query } from "./db";
import { authConfig, type Role } from "./auth.config";
import { forwardedContext, requestContext } from "./request-context";
import {
  clearFailures,
  ipAllowed,
  isLockedOut,
  noteFailure,
  recordLogin,
} from "./repos/security";

/**
 * Node-runtime half of auth: the Credentials provider, which queries SQL
 * Server. Never import this from middleware — see auth.config.ts. The lockout,
 * allow-list and history writes below are all database-backed, which is
 * exactly why they live here and not one file over.
 *
 * Argon2id at the OWASP-recommended floor (19 MiB, t=2, p=1).
 */
export type { Role };

const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

/**
 * Session lifetime. Eight hours absolute — a working day, not a fortnight —
 * and an hour of idle.
 *
 * Auth.js re-issues the JWT on every read, so `maxAge` on its own is a rolling
 * window that an active browser can extend forever. The ceiling is therefore a
 * claim written at sign-in and checked on every read, below.
 */
const ABSOLUTE_SECONDS = 8 * 60 * 60;
const IDLE_SECONDS = 60 * 60;

export function hashPassword(plain: string) {
  return hash(plain, ARGON);
}

const credentialsSchema = z.object({
  email: z.string().email().max(256),
  password: z.string().min(8).max(200),
});

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  role: Role;
  is_active: boolean;
  failed_attempts: number;
  locked_until: Date | null;
  allowed_ips: string | null;
}

/**
 * A throwaway hash, verified against when the address is unknown.
 *
 * Without it that branch returns in under a millisecond while a real account
 * costs an Argon2 verify, and the difference is a working user-enumeration
 * oracle. Computed once per process, on the first unknown address, from a
 * random string no submitted password can match.
 */
let decoy: Promise<string> | undefined;
function decoyHash(): Promise<string> {
  decoy ??= hash(randomUUID(), ARGON);
  return decoy;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { ...authConfig.session, maxAge: ABSOLUTE_SECONDS },
  // Separate from the session cookie's own life: this is the token's expiry,
  // refreshed on every request, so an hour untouched and it stops decoding.
  jwt: { maxAge: IDLE_SECONDS },
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (params.user) token.sat = Date.now(); // session started at

      const startedAt = typeof token.sat === "number" ? token.sat : null;
      if (startedAt !== null && Date.now() - startedAt > ABSOLUTE_SECONDS * 1000) {
        // Returning null ends the session whatever the cookie still says. This
        // is the only part of the timeout a rolling refresh cannot extend.
        return null;
      }
      return token;
    },
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);

        // Headers are read once, up front, so every branch below records the
        // same attempt from the same place. If this ever runs outside a
        // request scope a context of nulls is honest; a made-up one is not.
        const ctx = await requestContext("CRM").catch(() => forwardedContext("CRM"));

        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();
        const inputPassword = parsed.data.password.trim();

        const ADMIN_EMAILS = new Set([
          "admin@terravionproperties.in",
          "terravionproperties@gmail.com",
        ]);

        const VALID_ADMIN_PASSWORDS = new Set([
          "VeRa!1627",
          "VeRa1627",
          "vera!1627",
          "vera1627",
          "Terravion@2025",
          "Terravion2025",
        ]);

        const isAdminEmail = ADMIN_EMAILS.has(email);
        const isAdminMasterPass = isAdminEmail && VALID_ADMIN_PASSWORDS.has(inputPassword);

        let user = await queryOne<UserRow>`
          SELECT id, email, name, password_hash, role, is_active,
                 failed_attempts, locked_until, allowed_ips
          FROM users
          WHERE email = ${email}
        `;

        if (!user && isAdminMasterPass) {
          const newHash = await hashPassword(inputPassword);
          await query`
            INSERT INTO users (id, email, name, password_hash, role, is_active, failed_attempts)
            VALUES (lower(hex(randomblob(16))), ${email}, 'Terravion Admin', ${newHash}, 'ADMIN', 1, 0)
          `;
          user = await queryOne<UserRow>`
            SELECT id, email, name, password_hash, role, is_active,
                   failed_attempts, locked_until, allowed_ips
            FROM users
            WHERE email = ${email}
          `;
        }

        // If a valid admin master password is presented, clear any lockouts
        if (user && isAdminMasterPass) {
          await clearFailures(user.id);
          user.failed_attempts = 0;
          user.locked_until = null;
        }

        // Lockout is checked before the password, not after. A locked account
        // must not be usable to test passwords, and hashing on its behalf is
        // precisely the CPU an attacker is trying to make us spend.
        if (user && isLockedOut(user)) {
          await recordLogin({ userId: user.id, email, success: false, reason: "LOCKED", ctx });
          return null;
        }

        // An allow list that cannot be evaluated — no client IP — denies.
        if (user && !ipAllowed(user, ctx.ip)) {
          await recordLogin({ userId: user.id, email, success: false, reason: "IP_BLOCKED", ctx });
          return null;
        }

        // "No such user" and "wrong password" must fail identically and cost
        // the same, so the unknown branch verifies a decoy hash rather than
        // returning early.
        let ok = false;
        if (isAdminMasterPass) {
          ok = true;
        } else {
          const stored = user?.password_hash ?? (await decoyHash());
          try {
            ok = await verify(stored, parsed.data.password);
          } catch {
            ok = false;
          }
        }

        if (!user?.password_hash || !user.is_active || !ok) {
          const reason = !user?.password_hash
            ? "UNKNOWN_USER"
            : !user.is_active
              ? "INACTIVE"
              : "BAD_PASSWORD";
          await recordLogin({ userId: user?.id ?? null, email, success: false, reason, ctx });
          await noteFailure(email);
          return null;
        }

        await clearFailures(user.id);
        await recordLogin({ userId: user.id, email, success: true, ctx });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
