import { site } from "@/lib/site";
import { projects } from "@/lib/data/projects";
import { posts } from "@/content/blog";
import { guides } from "@/content/guides";
import { mediaFor, mediaUrl, type MediaImage } from "@/lib/data/project-media";
import { PROJECT_STILLS, stillUrl } from "@/lib/film";
import { getArticleIllustration } from "@/lib/illustrations";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { sitemapEntries, absoluteFor } from "@/lib/sitemap-data";

/**
 * The image sitemap, derived — never re-listed.
 *
 * Two rules hold this file together.
 *
 * The first: a URL may appear here only if `lib/sitemap-data.ts` already says it
 * exists. The image sitemap is a *view* over that list, not a second list of
 * pages. It joins on `path`, so a page that is dropped, renamed or narrowed to
 * fewer locales there disappears from here in the same commit, and an image
 * sitemap advertising a 404 is structurally impossible.
 *
 * The second: no text is invented. `<image:title>` and `<image:caption>` are
 * emitted only where the codebase already holds real alt or caption copy for
 * that image — an article's hero `alt`, a gallery item's `alt`/`caption`. Where
 * the page carries a decorative background with `aria-hidden` and no alt (the
 * project hero frames), only `<image:loc>` goes out. A caption written for the
 * sitemap and nowhere else is a fabricated signal, and Google treats it as one.
 *
 * Titles and captions are attached to the English URL only. The same artwork
 * appears on `/te/...` and `/hi/...`, so those URLs list `<image:loc>` and
 * nothing more: shipping the English alt text under a Telugu URL would be a
 * claim about language that is not true.
 *
 * ── Why there is no companion video sitemap ──────────────────────────────
 *
 * The site serves 18 real project films from `public/assets/*.mp4`, and
 * `MediaVideo` in `lib/data/project-media.ts` gives each one a genuine title —
 * so `<video:content_loc>` and `<video:title>` are both satisfiable. The other
 * two required fields are not:
 *
 *   · `<video:thumbnail_loc>` — nothing anywhere holds a poster frame. The
 *     `<video>` elements in `components/projects/ProjectMedia.tsx` carry no
 *     `poster` attribute, `MediaVideo` has no thumbnail field, and the
 *     `thumbnail?` property declared on `Asset` in `components/gallery/
 *     GalleryViewer.tsx` is set on zero assets. The frames under `public/film/`
 *     belong to an unrelated cinematic reel, so pointing a film's thumbnail at
 *     one would misrepresent the video's content.
 *   · `<video:description>` — `MediaVideo` has no description field, and there
 *     is no `player_loc` alternative either: no YouTube embed, no `<iframe>`,
 *     no `VideoObject` schema exists in the codebase.
 *
 * Both gaps could only be closed by writing copy and choosing frames here, in
 * a sitemap, for search engines to read and users never to see. Google treats
 * a video sitemap as a description of what the visitor gets; one assembled from
 * invented metadata is a worse outcome than no video sitemap at all. Add real
 * `thumbnail` and `description` fields to `MediaVideo`, populate them from the
 * films themselves, and the route becomes worth building.
 */

export interface SitemapImage {
  /** Absolute image URL. */
  loc: string;
  /** Real alt text, where the page has some. Never invented. */
  title?: string;
  /** Real caption text, where the data carries one. Never invented. */
  caption?: string;
}

export interface ImageSitemapEntry {
  path: string;
  locales: Locale[];
  images: SitemapImage[];
}

/** XML text escaping — all five predefined entities. */
export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Absolutise an asset path.
 *
 * Goes through `mediaUrl()` for project media so the sitemap and the markup
 * always name the same file: if `NEXT_PUBLIC_MEDIA_BASE` is ever pointed at a
 * CDN, both move together. With it unset — the current state — every asset
 * resolves onto the canonical domain from `lib/site.ts`.
 */
function absoluteAsset(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = site.domain.replace(/\/$/, "");
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** Gallery and press items already carry alt and caption; both are real copy. */
function fromMediaImage(img: MediaImage): SitemapImage {
  return {
    loc: absoluteAsset(mediaUrl(img.src)),
    ...(img.alt ? { title: img.alt } : {}),
    ...(img.caption ? { caption: img.caption } : {}),
  };
}

/**
 * path → the images that page actually renders.
 *
 * Location pages are absent on purpose: `LocationContent` has no artwork field
 * and `app/[locale]/locations/[slug]/page.tsx` renders no `<Image>`. Listing
 * pages (`/blog`, `/guides`, `/gallery`) are absent too — every image on them is
 * already listed against the article or project page it belongs to, which is
 * where Google is asked to associate it.
 */
function imagesByPath(): Map<string, SitemapImage[]> {
  const map = new Map<string, SitemapImage[]>();

  // Articles: one hero illustration each, alt = the article title.
  for (const p of posts) {
    map.set(`/blog/${p.slug}`, [
      { loc: absoluteAsset(getArticleIllustration(p.slug)), title: p.title },
    ]);
  }
  for (const g of guides) {
    map.set(`/guides/${g.slug}`, [
      { loc: absoluteAsset(getArticleIllustration(g.slug)), title: g.title },
    ]);
  }

  // Projects: the hero film frame (also the page's og:image), then the gallery
  // and the press coverage.
  for (const project of projects) {
    const images: SitemapImage[] = [];

    const still = PROJECT_STILLS[project.slug];
    if (still) {
      // No title: on the page this frame is a CSS background marked
      // `aria-hidden`, so there is no alt text to quote.
      images.push({ loc: absoluteAsset(stillUrl(still.hero)) });
    }

    const media = mediaFor(project.slug);
    if (media) {
      images.push(...media.gallery.map(fromMediaImage));
      images.push(...media.news.map(fromMediaImage));
    }

    if (images.length) map.set(`/projects/${project.slug}`, images);
  }

  return map;
}

/**
 * Every indexable URL that has images, with the images it has.
 *
 * The join against `sitemapEntries()` is what keeps the two files honest: the
 * locale list comes from there, so an article translated into Telugu tomorrow
 * gains its `/te/` image URL here without this module being touched.
 */
export function imageSitemapEntries(): ImageSitemapEntry[] {
  const byPath = imagesByPath();

  return sitemapEntries()
    .map((entry) => {
      const images = byPath.get(entry.path);
      if (!images?.length) return null;
      // De-duplicate: the same asset is reused across projects (Terravion_images1
      // appears in two galleries), and a URL must list each image once.
      const seen = new Set<string>();
      const unique = images.filter((i) => !seen.has(i.loc) && seen.add(i.loc));
      return { path: entry.path, locales: entry.locales, images: unique };
    })
    .filter((e): e is ImageSitemapEntry => e !== null);
}

/** Rows are `(entry × locale)`, matching the URLs the per-language sitemaps list. */
export function renderImageSitemapXml(entries: ImageSitemapEntry[]): string {
  const rows = entries
    .flatMap((entry) =>
      entry.locales.map((locale) => {
        const images = entry.images
          .map((img) => {
            const lines = [
              "    <image:image>",
              `      <image:loc>${xmlEscape(img.loc)}</image:loc>`,
            ];
            // English only — see the note at the top of this file.
            if (locale === DEFAULT_LOCALE) {
              if (img.title) {
                lines.push(`      <image:title>${xmlEscape(img.title)}</image:title>`);
              }
              if (img.caption) {
                lines.push(`      <image:caption>${xmlEscape(img.caption)}</image:caption>`);
              }
            }
            lines.push("    </image:image>");
            return lines.join("\n");
          })
          .join("\n");

        return [
          "  <url>",
          `    <loc>${xmlEscape(absoluteFor(entry.path, locale))}</loc>`,
          images,
          "  </url>",
        ].join("\n");
      })
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${rows}
</urlset>
`;
}
