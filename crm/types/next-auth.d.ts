import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/auth";

/**
 * Carries id and role through the session so components, server actions and
 * middleware can gate on them without a database round-trip. `id` and `role`
 * are non-optional here because the jwt/session callbacks always set them —
 * making them optional would push a null check into every call site for a
 * case that cannot occur.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: Role;
  }
}
