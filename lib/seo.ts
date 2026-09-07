import type { Metadata } from "next";
import { site } from "./site";

/**
 * One place where page metadata is assembled.
 *
 * The bug this exists to prevent: Next does not deep-merge metadata. A page
 * that sets `openGraph: { title, description }` does not inherit the layout's
 * `openGraph.images` — it *replaces* the whole object and ships with no share
 * image. That silently cost roughly a hundred pages their Open Graph and
 * Twitter images, and nothing in the build or the type system complained,
 * because an incomplete `openGraph` is perfectly valid.
 *
 * So no page builds a `Metadata` literal by hand any more. Every one goes
 * through a builder here, and the builders always fill in the image, the
 * canonical, the alternates and the robots directives. Forgetting is no longer
 * possible, which is the only kind of fix that survives the next contributor.
 */

/**
 * Locales come from `lib/i18n/config.ts`.
 *
 * The routing, the fonts, the selector and this file all have to agree about
 * which languages exist, and two lists that must agree are one list waiting to
 * drift apart. This module re-exports rather than redeclares.
 */
import {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_META,
  localizePath,
  type Locale,
} from "./i18n/config";

export { LOCALES, DEFAULT_LOCALE };
export type { Locale };

/** The site's default share image. A rendered route, not a static file. */
const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${site.name} — villa plots in Shankarpally, West Hyderabad`,
};

export interface PageSeo {
  title: string;
  description: string;
  /** Absolute path from the site root, e.g. `/projects/sanctuary`. */
  path: string;
  keywords?: readonly string[];
  /** Path or absolute URL. Falls back to the site default. */
  image?: string | null;
  imageAlt?: string | null;
  /** `article` for anything with a byline and a date. */
  type?: "website" | "article" | "profile";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: readonly string[];
  section?: string | null;
  tags?: readonly string[];
  /** Only for thin or duplicate pages that should stay out of the index. */
  noIndex?: boolean;
  /** The language this page is being rendered in. Drives canonical and og:locale. */
  locale?: Locale;
  /**
   * The languages this page genuinely exists in. Defaults to all of them,
   * which is right for anything whose copy lives in the JSON dictionaries.
   * Article routes narrow it to the locales their body has been translated
   * into — see `lib/content/translated.ts`.
   */
  availableLocales?: readonly Locale[];
  /**
   * The locale whose URL is the canonical one for this page. Defaults to the
   * page's own locale, which is right whenever the copy really is in that
   * language.
   *
   * Article routes now render in-locale even when only the card is translated
   * and the prose underneath is still English. Such a page must not claim
   * `/te/blog/x` as canonical — that would offer Google two URLs whose body
   * text is identical. It points at the English original instead, while
   * `availableLocales` keeps hreflang and the sitemaps honest.
   */
  canonicalLocale?: Locale;
}

function absolute(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = site.domain.replace(/\/$/, "");
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function canonicalPath(path: string): string {
  // A trailing slash makes `/guides/x` and `/guides/x/` two URLs to a crawler.
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.length > 1 ? p.replace(/\/+$/, "") : "/";
}

/**
 * hreflang for the locales this particular page exists in, plus x-default.
 *
 * The `available` argument is the whole point, and it is per-page rather than
 * global. Every page has translated chrome, but a journal essay whose body has
 * not been translated yet exists only in English — and announcing
 * `hreflang="te-IN"` for a URL that serves English prose is worse than
 * announcing nothing. Google follows the claim, finds the wrong language,
 * and the cluster loses trust across every URL in it.
 *
 * So pages that are genuinely translated pass all three; pages that are not
 * pass only the locales they have. x-default always points at English, because
 * that is where an unmatched visitor should land.
 */
function languageAlternates(path: string, available: readonly Locale[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const loc of available) {
    out[LOCALE_META[loc].bcp47] = absolute(localizePath(path, loc));
  }
  out["x-default"] = absolute(localizePath(path, DEFAULT_LOCALE));
  return out;
}

/**
 * Build a complete `Metadata` object. Every field the audit found missing is
 * filled here, or it is not filled anywhere.
 */
export function buildPageMetadata(seo: PageSeo): Metadata {
  const path = canonicalPath(seo.path);
  const locale = seo.locale ?? DEFAULT_LOCALE;
  const available = seo.availableLocales ?? LOCALES;

  // The canonical is this language's own URL, not English's. A Telugu page
  // canonicalising to `/projects` would tell Google the Telugu version is a
  // duplicate and should be dropped from the index — which is the exact
  // opposite of what a translated site wants.
  const url = absolute(localizePath(path, seo.canonicalLocale ?? locale));

  const image = seo.image
    ? {
        url: absolute(seo.image),
        width: 1200,
        height: 630,
        alt: seo.imageAlt ?? seo.title,
      }
    : { ...DEFAULT_OG_IMAGE, url: absolute(DEFAULT_OG_IMAGE.url) };

  const isArticle = seo.type === "article";

  return {
    // Set on every page, not just the root layout. Next resolves relative
    // image paths against this; without it a route whose metadata does not
    // inherit the layout's copy falls back to http://localhost:3000, which
    // ships localhost URLs into production OG tags.
    metadataBase: new URL(site.domain),
    title: seo.title,
    description: seo.description,
    ...(seo.keywords?.length ? { keywords: [...seo.keywords] } : {}),

    alternates: {
      canonical: url,
      languages: languageAlternates(path, available),
    },

    openGraph: {
      type: isArticle ? "article" : seo.type === "profile" ? "profile" : "website",
      url,
      siteName: site.name,
      locale: LOCALE_META[locale].ogLocale,
      alternateLocale: available
        .filter((l) => l !== locale)
        .map((l) => LOCALE_META[l].ogLocale),
      title: seo.title,
      description: seo.description,
      images: [image],
      ...(isArticle
        ? {
            publishedTime: seo.publishedTime ?? undefined,
            modifiedTime: seo.modifiedTime ?? seo.publishedTime ?? undefined,
            authors: seo.authors ? [...seo.authors] : [site.name],
            section: seo.section ?? undefined,
            tags: seo.tags ? [...seo.tags] : undefined,
          }
        : {}),
    },

    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [image.url],
    },

    robots: seo.noIndex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

/**
 * Merge a partial override onto built metadata.
 *
 * Shallow-merges the nested objects Next would otherwise replace wholesale —
 * which is the entire point. Reach for this only when a page needs something
 * genuinely unusual; the builders below cover every current case.
 */
export function mergeMetadata(base: Metadata, override: Metadata): Metadata {
  return {
    ...base,
    ...override,
    alternates: { ...base.alternates, ...override.alternates },
    openGraph:
      base.openGraph || override.openGraph
        ? ({ ...base.openGraph, ...override.openGraph } as Metadata["openGraph"])
        : undefined,
    twitter:
      base.twitter || override.twitter
        ? ({ ...base.twitter, ...override.twitter } as Metadata["twitter"])
        : undefined,
    robots: override.robots ?? base.robots,
  };
}

// ── typed builders, one per content shape ────────────────────────────────

export function buildProjectMetadata(p: {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords?: readonly string[];
  name: string;
  heroImage?: string | null;
  locale?: Locale;
  availableLocales?: readonly Locale[];
}): Metadata {
  return buildPageMetadata({
    title: p.metaTitle,
    description: p.metaDescription,
    path: `/projects/${p.slug}`,
    keywords: p.keywords,
    image: p.heroImage ?? null,
    imageAlt: `${p.name} — villa plots by ${site.name}`,
    type: "website",
    locale: p.locale,
    availableLocales: p.availableLocales,
  });
}

export function buildGuideMetadata(g: {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords?: readonly string[];
  title: string;
  heroImage?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: string | null;
  locale?: Locale;
  availableLocales?: readonly Locale[];
  canonicalLocale?: Locale;
}): Metadata {
  return buildPageMetadata({
    title: g.metaTitle,
    description: g.metaDescription,
    path: `/guides/${g.slug}`,
    keywords: g.keywords,
    image: g.heroImage ?? null,
    imageAlt: g.title,
    type: "article",
    publishedTime: g.publishedAt ?? null,
    modifiedTime: g.updatedAt ?? null,
    authors: g.author ? [g.author] : undefined,
    section: "Guides",
    locale: g.locale,
    availableLocales: g.availableLocales,
    canonicalLocale: g.canonicalLocale,
  });
}

export function buildArticleMetadata(a: {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords?: readonly string[];
  title: string;
  heroImage?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: string | null;
  category?: string | null;
  locale?: Locale;
  availableLocales?: readonly Locale[];
  canonicalLocale?: Locale;
}): Metadata {
  return buildPageMetadata({
    title: a.metaTitle,
    description: a.metaDescription,
    path: `/blog/${a.slug}`,
    keywords: a.keywords,
    image: a.heroImage ?? null,
    imageAlt: a.title,
    type: "article",
    publishedTime: a.publishedAt ?? null,
    modifiedTime: a.updatedAt ?? null,
    authors: a.author ? [a.author] : undefined,
    section: a.category ?? "Journal",
    locale: a.locale,
    availableLocales: a.availableLocales,
    canonicalLocale: a.canonicalLocale,
  });
}

export function buildLocationMetadata(l: {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords?: readonly string[];
  name: string;
  heroImage?: string | null;
  locale?: Locale;
  availableLocales?: readonly Locale[];
  canonicalLocale?: Locale;
}): Metadata {
  return buildPageMetadata({
    title: l.metaTitle,
    description: l.metaDescription,
    path: `/locations/${l.slug}`,
    keywords: l.keywords,
    image: l.heroImage ?? null,
    imageAlt: `${l.name}, West Hyderabad`,
    type: "website",
    locale: l.locale,
    availableLocales: l.availableLocales,
    canonicalLocale: l.canonicalLocale,
  });
}
