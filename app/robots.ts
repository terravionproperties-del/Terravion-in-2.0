import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/config";

/**
 * Open to all crawlers, with AI crawlers (GPTBot, ClaudeBot, Google-Extended,
 * PerplexityBot et al.) explicitly welcomed — llms.txt gives them a map.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "Claude-Web", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "anthropic-ai", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "CCBot", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "Applebot-Extended", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    // All three, listed explicitly. Google discovers per-language sitemaps
    // through robots.txt or Search Console — it does not infer them from a
    // naming pattern, so an unlisted sitemap-te.xml is simply never read.
    //
    // The image sitemap is listed for exactly the same reason. There is no
    // video sitemap: the project films have titles and playable files but no
    // thumbnails and no descriptions, and Google requires both. See the note in
    // `lib/sitemap-images.ts` — a video sitemap with invented metadata is worse
    // than none.
    sitemap: [
      ...LOCALES.map((l) =>
        l === DEFAULT_LOCALE ? `${site.domain}/sitemap.xml` : `${site.domain}/sitemap-${l}.xml`
      ),
      `${site.domain}/sitemap-images.xml`,
    ],
    host: site.domain,
  };
}
