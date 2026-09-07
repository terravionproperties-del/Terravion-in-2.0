import { site } from "@/lib/site";
import { projects } from "@/lib/data/projects";
import { posts } from "@/content/blog";
import { guides } from "@/content/guides";
import { locations } from "@/content/locations";
import { DEFAULT_LOCALE, LOCALES, localizePath, type Locale } from "@/lib/i18n/config";
import { availableLocalesFor } from "@/lib/content/translated";

/**
 * The one list of URLs, shared by every sitemap.
 *
 * `app/sitemap.ts`, `/sitemap-te.xml` and `/sitemap-hi.xml` all read this, so
 * the three can never disagree about what exists. That was worth a module: a
 * per-language sitemap assembled independently is a per-language sitemap that
 * drifts.
 *
 * The important rule is encoded in the `locales` field. Static pages — home,
 * projects, contact — exist in all three languages, because their copy comes
 * from the JSON dictionaries and is fully translated. Article routes exist in a
 * language only once their *body* has been translated. Listing
 * `/te/blog/<slug>` while it still serves English prose invites Google to crawl
 * it, find English, and discount the whole Telugu cluster.
 */

export interface SitemapEntry {
  /** Canonical, unprefixed path. */
  path: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  /** Languages this URL genuinely exists in. */
  locales: Locale[];
}

const ALL_LOCALES: Locale[] = [...LOCALES];

const STATIC_PAGES: Array<Omit<SitemapEntry, "lastModified" | "locales">> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
  { path: "/investment", priority: 0.9, changeFrequency: "monthly" },
  { path: "/site-visit", priority: 0.9, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
  { path: "/locations", priority: 0.8, changeFrequency: "weekly" },
  { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.8, changeFrequency: "daily" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/amenities", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tools/emi-calculator", priority: 0.7, changeFrequency: "yearly" },
  { path: "/tools/roi-calculator", priority: 0.7, changeFrequency: "yearly" },
  { path: "/founder", priority: 0.6, changeFrequency: "monthly" },
  { path: "/gallery", priority: 0.6, changeFrequency: "monthly" },
  { path: "/testimonials", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export function sitemapEntries(now = new Date()): SitemapEntry[] {
  return [
    ...STATIC_PAGES.map((p) => ({ ...p, lastModified: now, locales: ALL_LOCALES })),

    // Project pages are translated chrome wrapped around business data from
    // lib/data/projects.ts. That data is not localised yet, so they list English
    // only — the same rule the articles follow, applied honestly to a different
    // content type.
    ...projects.map((p) => ({
      path: `/projects/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.95,
      locales: [DEFAULT_LOCALE],
    })),

    ...locations.map((l) => ({
      path: `/locations/${l.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
      locales: availableLocalesFor("locations", l.slug),
    })),

    ...guides.map((g) => ({
      path: `/guides/${g.slug}`,
      lastModified: new Date(`${g.updated}T00:00:00`),
      changeFrequency: "monthly" as const,
      priority: 0.75,
      locales: availableLocalesFor("guides", g.slug),
    })),

    ...posts.map((p) => ({
      path: `/blog/${p.slug}`,
      lastModified: new Date(`${p.updated}T00:00:00`),
      changeFrequency: "monthly" as const,
      priority: 0.65,
      locales: availableLocalesFor("blog", p.slug),
    })),
  ];
}

export function absoluteFor(path: string, locale: Locale): string {
  return `${site.domain.replace(/\/$/, "")}${localizePath(path, locale)}`;
}

function hreflangOf(locale: Locale): string {
  return locale === "en" ? "en-IN" : `${locale}-IN`;
}

/**
 * Render a per-language sitemap as raw XML.
 *
 * Next's `MetadataRoute.Sitemap` does support `alternates.languages`, but it
 * cannot express "this URL exists in en and te but not hi" cleanly across
 * separate per-language files. Writing the XML directly is a few lines and
 * removes the ambiguity — and `xhtml:link` alternates are what Google actually
 * reads out of a sitemap.
 */
export function renderSitemapXml(locale: Locale, entries: SitemapEntry[]): string {
  const rows = entries
    .filter((e) => e.locales.includes(locale))
    .map((e) => {
      const alternates = e.locales
        .map(
          (l) =>
            `    <xhtml:link rel="alternate" hreflang="${hreflangOf(l)}" href="${absoluteFor(e.path, l)}"/>`
        )
        .join("\n");

      return [
        "  <url>",
        `    <loc>${absoluteFor(e.path, locale)}</loc>`,
        `    <lastmod>${e.lastModified.toISOString().slice(0, 10)}</lastmod>`,
        `    <changefreq>${e.changeFrequency}</changefreq>`,
        `    <priority>${e.priority.toFixed(2)}</priority>`,
        alternates,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteFor(e.path, DEFAULT_LOCALE)}"/>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${rows}
</urlset>
`;
}
