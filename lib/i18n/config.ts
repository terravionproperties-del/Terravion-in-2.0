/**
 * The single source of truth for which languages exist and how each behaves.
 *
 * Everything downstream — middleware, fonts, metadata, sitemaps, the selector —
 * reads this file. Adding a fourth language should mean editing this object and
 * writing the JSON, and nothing else. That is the test this module has to pass.
 *
 * Note the deliberate split between `LOCALES` (routable) and `translatedIn()`
 * over in the content layer: a locale is routable the moment its UI strings
 * exist, but a *page* only earns an hreflang once its body copy is genuinely
 * translated. Those are different questions, and conflating them is how sites
 * end up advertising Telugu URLs that serve English prose.
 */

export const LOCALES = ["en", "te", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export interface LocaleMeta {
  /** The language's name written in that language. Never translated. */
  readonly nativeName: string;
  /** English name, for the language menu's accessible description. */
  readonly englishName: string;
  /** BCP-47 tag for `<html lang>`, hreflang and Intl. */
  readonly bcp47: string;
  /** Open Graph wants underscores and a region. Different format, same idea. */
  readonly ogLocale: string;
  /** Writing direction. Present from day one so RTL is a data change. */
  readonly dir: "ltr" | "rtl";
  /** Regional flag emoji shown in the selector. */
  readonly flag: string;
  /**
   * Extra terms a user might type into the selector's search box —
   * romanised spellings, mostly, because a Telugu speaker on a QWERTY
   * keyboard types "telugu" long before they type "తెలుగు".
   */
  readonly searchAliases: readonly string[];
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: {
    nativeName: "English",
    englishName: "English",
    bcp47: "en-IN",
    ogLocale: "en_IN",
    dir: "ltr",
    flag: "🇬🇧",
    searchAliases: ["english", "en", "inglish", "angla"],
  },
  te: {
    nativeName: "తెలుగు",
    englishName: "Telugu",
    bcp47: "te-IN",
    ogLocale: "te_IN",
    dir: "ltr",
    flag: "🇮🇳",
    searchAliases: ["telugu", "te", "telegu", "tenugu", "andhra", "telangana"],
  },
  hi: {
    nativeName: "हिन्दी",
    englishName: "Hindi",
    bcp47: "hi-IN",
    ogLocale: "hi_IN",
    dir: "ltr",
    flag: "🇮🇳",
    searchAliases: ["hindi", "hi", "hindustani", "devanagari"],
  },
};

/** Cookie the middleware and the selector both agree on. */
export const LOCALE_COOKIE = "terravion_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year

/** localStorage mirror, so a client render can pick the right thing instantly. */
export const LOCALE_STORAGE_KEY = "terravion.locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Narrow anything to a usable locale.
 *
 * Accepts full BCP-47 too, so `te-IN`, `hi_IN` and `TE` all resolve. Browsers
 * are not consistent about the shape they send, and it is cheaper to be liberal
 * here than to debug a mis-detected language later.
 */
export function coerceLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const base = value.toLowerCase().replace(/_/g, "-").split("-")[0];
  return isLocale(base) ? base : null;
}

/**
 * Resolve the visitor's language from the three signals, in the order the brief
 * specifies: a previous explicit choice beats the browser, which beats the
 * default. An explicit choice is the only one it can be *wrong* to override,
 * which is why it wins.
 */
export function resolveLocale(input: {
  cookie?: string | null;
  acceptLanguage?: string | null;
}): { locale: Locale; source: "cookie" | "header" | "default" } {
  const fromCookie = coerceLocale(input.cookie);
  if (fromCookie) return { locale: fromCookie, source: "cookie" };

  const fromHeader = parseAcceptLanguage(input.acceptLanguage);
  if (fromHeader) return { locale: fromHeader, source: "header" };

  return { locale: DEFAULT_LOCALE, source: "default" };
}

/**
 * Pick the best supported language out of an Accept-Language header.
 *
 * Respects q-values rather than taking the first entry, because a browser
 * configured as `en;q=0.8, te;q=0.9` genuinely does prefer Telugu, and taking
 * `en` there would be a bug the user could never explain.
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag: tag.trim(), quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const entry of ranked) {
    const locale = coerceLocale(entry.tag);
    if (locale) return locale;
  }
  return null;
}

// ── path helpers ──────────────────────────────────────────────────────────
//
// One pair of functions owns the prefix convention: English is served from the
// root, every other language takes a path prefix. That is the Apple/Stripe
// shape — the default market keeps the clean URLs it already ranks for.
//
// Components never build a localised href by hand. If they did, the "en has no
// prefix" rule would be re-implemented slightly differently in a dozen places,
// which is exactly the class of bug that makes a language switch land on a 404.

/** Strip a leading locale segment, returning the canonical (English) path. */
export function stripLocale(pathname: string): { locale: Locale | null; path: string } {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (isLocale(first)) {
    const rest = segments.slice(1).join("/");
    return { locale: first, path: rest ? `/${rest}` : "/" };
  }
  return { locale: null, path: pathname || "/" };
}

/** Build the public URL for a canonical path in a given language. */
export function localizePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const normalised = clean.length > 1 ? clean.replace(/\/+$/, "") : "/";
  if (locale === DEFAULT_LOCALE) return normalised;
  return normalised === "/" ? `/${locale}` : `/${locale}${normalised}`;
}
