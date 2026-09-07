import { imageSitemapEntries, renderImageSitemapXml } from "@/lib/sitemap-images";

/**
 * The image sitemap.
 *
 * A route handler for the same reason `/sitemap-te.xml` is one: Next recognises
 * a single `sitemap` convention file per segment, and the `image:` namespace is
 * easier to state directly than to coax out of `MetadataRoute.Sitemap`.
 *
 * Every URL here is joined against `lib/sitemap-data.ts`, so this file can never
 * advertise a page the language sitemaps do not list. See `lib/sitemap-images.ts`
 * for why titles and captions are English-only and why nothing is invented.
 */
export const dynamic = "force-static";

export function GET() {
  const xml = renderImageSitemapXml(imageSitemapEntries());
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
