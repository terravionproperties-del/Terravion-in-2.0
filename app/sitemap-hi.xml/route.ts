import { renderSitemapXml, sitemapEntries } from "@/lib/sitemap-data";

/**
 * The hi sitemap.
 *
 * A route handler rather than a `sitemap.ts` convention file, because Next only
 * recognises one `sitemap` per segment and the shape needed here — per-URL
 * `xhtml:link` alternates that differ between languages — is easier to state
 * directly than to coax out of `MetadataRoute.Sitemap`.
 *
 * Only URLs whose content genuinely exists in hi appear. An article whose body
 * is still English is absent by design: see `lib/content/translated.ts`.
 */
export const dynamic = "force-static";

export function GET() {
  const xml = renderSitemapXml("hi", sitemapEntries());
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
