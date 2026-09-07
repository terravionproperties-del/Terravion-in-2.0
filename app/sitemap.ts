import type { MetadataRoute } from "next";
import { LOCALES, localizePath } from "@/lib/i18n/config";
import { sitemapEntries, absoluteFor } from "@/lib/sitemap-data";

/**
 * The English sitemap, plus hreflang alternates for every URL.
 *
 * Telugu and Hindi get their own files (`/sitemap-te.xml`, `/sitemap-hi.xml`)
 * because the brief asks for one per language and because splitting them keeps
 * each under Google's 50,000-URL limit as the corpus grows. All three are
 * generated from `lib/sitemap-data.ts`, so they cannot disagree.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries = sitemapEntries();

  return entries
    .filter((e) => e.locales.includes("en"))
    .map((e) => ({
      url: absoluteFor(e.path, "en"),
      lastModified: e.lastModified,
      changeFrequency: e.changeFrequency,
      priority: e.priority,
      alternates: {
        languages: Object.fromEntries([
          ...e.locales.map((l) => [l === "en" ? "en-IN" : `${l}-IN`, absoluteFor(e.path, l)]),
          ["x-default", absoluteFor(e.path, "en")],
        ]),
      },
    }));
}

/** Referenced by robots.txt so crawlers find the other two. */
export const SITEMAP_URLS = LOCALES.map((l) =>
  l === "en" ? "/sitemap.xml" : `/sitemap-${l}.xml`
).map((p) => localizePath(p, "en"));
