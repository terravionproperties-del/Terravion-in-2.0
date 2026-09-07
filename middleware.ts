import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
} from "@/lib/i18n/config";

/**
 * Locale routing.
 *
 * Three jobs, in order:
 *
 *   1. `/en/anything` is not a canonical URL. Permanent-redirect it to the
 *      unprefixed form so the two never both exist in an index.
 *   2. `/te/...` and `/hi/...` pass straight through to `app/[locale]/...`.
 *   3. Everything else is English. It gets *rewritten* — not redirected — to
 *      `/en/...`, so the visitor keeps the clean URL while the router still
 *      resolves a `[locale]` segment.
 *
 * The URL is the only thing that decides language. There is exactly one redirect
 * in this file — the `/en/*` canonicalisation — and it can only fire once,
 * because its target never matches the branch that produced it.
 *
 * Nothing here reads the cookie or Accept-Language to choose a destination. An
 * earlier version did both, and it deadlocked: choosing English wrote
 * `terravion_locale=en` and navigated to `/`, the RSC request raced the cookie
 * write, middleware read a stale `te` and redirected back, and the selector
 * navigated again. The cookie is now written, never read for routing.
 */

/** Paths that must never be touched: assets, the film reel, API, metadata routes. */
const BYPASS =
  /^\/(?:_next|api|film|assets|images|videos|fonts|favicon|icon|apple-icon|opengraph-image|robots\.txt|sitemap|manifest\.webmanifest|rss\.xml)/;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (BYPASS.test(pathname) || pathname.includes(".")) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // ── 0. the admin surface fails closed in production ─────────────────────
  //
  // There is no visitor-facing login on this site, so until real staff auth
  // exists the admin tree is reachable only when ADMIN_ENABLED=true is set in
  // the environment (local development sets nothing and NODE_ENV is not
  // "production", so dev keeps working). Everyone else gets the 404 page —
  // not a redirect, so the URL's existence is not even confirmed.
  const adminSegment = isLocale(first) ? segments[1] : segments[0];
  if (
    adminSegment === "admin" &&
    process.env.NODE_ENV === "production" &&
    process.env.ADMIN_ENABLED !== "true"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/404";
    return NextResponse.rewrite(url, { status: 404 });
  }

  // ── 1. `/en/...` is a duplicate of the canonical URL ────────────────────
  if (first === DEFAULT_LOCALE) {
    const rest = segments.slice(1).join("/");
    const url = request.nextUrl.clone();
    url.pathname = rest ? `/${rest}` : "/";
    const response = NextResponse.redirect(url, 308);
    response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, cookieOptions());
    return response;
  }

  // ── 2. an explicitly prefixed non-default locale ────────────────────────
  if (isLocale(first)) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, first, cookieOptions());
    response.headers.set("x-terravion-locale", first);
    response.headers.set("x-pathname", pathname);
    response.headers.set("Vary", "Accept-Language, Cookie");
    return response;
  }


  // ── 3. unprefixed is English. Always. Rewrite, never redirect ───────────
  //
  // This used to 307 to `/te` when the cookie said Telugu, and again from
  // Accept-Language when there was no cookie. Both were loops waiting to happen,
  // and one of them fired: choosing English wrote `terravion_locale=en` and
  // called `router.replace("/")`, but the RSC request for `/` raced the cookie
  // write — middleware still read `te`, redirected to `/te`, and the selector
  // saw the locale unchanged and navigated again. An endless spinner.
  //
  // A URL now means exactly one language, decided by the URL alone. The cookie
  // records the last choice for the selector to read; it no longer steers
  // routing, so there is nothing left to loop against. Unprefixed is English for
  // everyone, including crawlers, which also removes the Accept-Language
  // cloaking question entirely.
  const canonicalPath = pathname === "/" ? "" : pathname;

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${canonicalPath}`;
  url.search = search;

  const response = NextResponse.rewrite(url);
  response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, cookieOptions());
  response.headers.set("x-terravion-locale", DEFAULT_LOCALE);
  response.headers.set("x-pathname", pathname);
  response.headers.set("Vary", "Cookie");
  return response;
}

function cookieOptions() {
  return {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    httpOnly: false, // the selector mirrors it into localStorage, so JS must read it
    secure: process.env.NODE_ENV === "production",
  };
}

export const config = {
  matcher: [
    /*
     * Everything the BYPASS regex also guards. Duplicated deliberately: the
     * matcher stops the middleware running at all (cheaper), and the regex
     * inside catches anything the matcher's syntax cannot express.
     */
    "/((?!_next/static|_next/image|api|film|assets|favicon.ico|robots.txt|sitemap|manifest.webmanifest|rss.xml|opengraph-image).*)",
  ],
};
