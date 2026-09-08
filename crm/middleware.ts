import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

/**
 * Built from the edge-safe config only. Importing `lib/auth.ts` here would
 * drag the SQL Server driver into the Edge bundle, which cannot load Node
 * built-ins — the build fails outright on `node:stream`.
 *
 * Everything is private except the sign-in page, the auth endpoints and the
 * inbound lead webhook (which authenticates by HMAC, having no session).
 * Deny-by-default: a new route is protected the moment it exists.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname === "/terravion-logo.jpeg" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    // The uptime probe. It has to answer without a session, or a monitor sees
    // the 302 to /login, reads it as a reachable site, and stays quiet while
    // the database is down. It returns liveness and latency only — no version,
    // no paths, no counts — precisely because it is reachable unauthenticated.
    pathname === "/api/health";

  if (isPublic) return NextResponse.next();

  if (!req.auth?.user) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "crm.terravionproperties.in";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const url = new URL("/login", `${proto}://${host}`);
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // A layout cannot see which route it is wrapping, and the forced
  // password-change gate in (app)/layout.tsx needs to exempt the change screen
  // itself — without this it would redirect that page to itself.
  return NextResponse.next({
    request: { headers: new Headers({ ...headersOf(req), "x-pathname": pathname }) },
  });
});

function headersOf(req: { headers: Headers }): Record<string, string> {
  const out: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
