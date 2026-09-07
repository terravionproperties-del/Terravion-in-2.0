import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/config";
import type { Faq } from "@/lib/types";
import { TRANSLATED, LOADERS, CARD_LOADERS } from "@/content/i18n";

/**
 * Article translation, as an overlay rather than a copy.
 *
 * The alternative — a full `content/te/blog/<slug>.ts` mirroring every field —
 * was rejected for one reason: it duplicates the parts that are *not* text.
 * Dates, reading time, category, illustration references and FAQ ordering would
 * all exist twice, drift independently, and the first symptom would be a Telugu
 * page quietly showing a stale publish date.
 *
 * So an overlay carries prose and nothing else. Everything structural stays on
 * the English module, which remains the single source of truth for what an
 * article *is*. That is also what makes "same images, same layout, same
 * chapters, only text changes" true by construction rather than by discipline.
 */

export type TranslationKind = "blog" | "guides" | "locations";

/** Every field an overlay may carry. All optional — partial work is normal. */
export interface ContentTranslation {
  title?: string;
  /** Locations call their headline `name`. */
  name?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  /** Blog posts call it `excerpt`; guides and locations call it `intro`. */
  excerpt?: string;
  intro?: string;
  /** Locations only. */
  epithet?: string;
  /** Markdown, same heading structure as the English original. */
  body?: string;
  faqs?: Faq[];
}

/**
 * The listing-page half of a translation: everything a card shows, and the
 * metadata that describes the article to a search engine or a share preview.
 *
 * Card text and body text are translated on different schedules on purpose. A
 * listing page is what a reader sees first, and it is 30-odd words per article
 * rather than 3,000 — so every card in the site can be Telugu long before any
 * body is. Splitting the two lets that happen without either pretending the
 * article is translated (it is not) or holding the listing hostage to the body.
 */
export interface CardTranslation {
  title: string;
  /** Blog calls it `excerpt`; guides and locations call it `intro`. */
  excerpt: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Locations only — the one-line characterisation under the name. */
  epithet?: string;
}

/**
 * Which languages this slug's *body* exists in.
 *
 * English is always included: it is the source. The rest come from the generated
 * index, so this is exactly the set of URLs that serve prose in the language
 * they claim — which is what `lib/seo.ts` needs for hreflang, and what the
 * sitemap needs in order not to list a Telugu URL that is really English.
 */
export function availableLocalesFor(kind: TranslationKind, slug: string): Locale[] {
  const extra = (TRANSLATED[kind]?.[slug] ?? []) as Locale[];
  return [
    DEFAULT_LOCALE,
    ...extra.filter((l) => LOCALES.includes(l) && l !== DEFAULT_LOCALE),
  ];
}

export function isTranslated(kind: TranslationKind, slug: string, locale: Locale): boolean {
  if (locale === DEFAULT_LOCALE) return true;
  return (TRANSLATED[kind]?.[slug] ?? []).includes(locale);
}

/**
 * Per-item translation state. Attached to every card; never used to hide one.
 *
 * Three states, not two, because "translated" was doing two jobs. A card can be
 * fully Telugu while the article behind it is still English — that is the
 * normal state during a card-first translation pass, and it drives the card's
 * *text* one way (Telugu) and its *destination* another (the English article).
 * Collapsing it into either neighbour produces a visible bug: into "translated"
 * and the card links at a route that does not exist in this language; into
 * "missing" and a perfectly good Telugu headline gets marked `lang="en"`.
 */
export type TranslationStatus = "translated" | "card" | "missing";

/**
 * A card's data.
 *
 * `content` is null when this locale has no translation, and that is the whole
 * point: attaching the English object was what put English titles on Telugu
 * pages. The renderer cannot leak prose it was never given.
 *
 * The structural fields survive regardless, because they are not prose. `slug`
 * addresses the illustration and the link; `category` is an enum key the
 * dictionary turns into a localised label; the dates and reading time go
 * through `Intl`. None of them can render an English sentence.
 */
export interface ItemMetadata {
  slug: string;
  /** Title in `textLocale`. Always present — it is how a reader identifies the card. */
  title: string;
  /** Excerpt (blog) or intro (guides/locations), in `textLocale`. */
  excerpt: string;
  /**
   * The language `title` and `excerpt` are actually written in.
   *
   * Cards render straight from this object, so the renderer cannot know whether
   * it is holding Telugu or English unless the resolver says so. This is what
   * `lang=` is set from: guessing it from the page locale marks translated text
   * as English, and guessing it from `status` marks card-translated text as
   * English too.
   */
  textLocale: Locale;
  category?: string;
  published?: string;
  updated?: string;
  readingMinutes?: number;
}

/**
 * Metadata always exists; only translated *body* content can be null.
 *
 * The distinction matters. An earlier version nulled everything, and the grid
 * drew twelve identical placeholder cards — a reader could no longer tell which
 * article was which, which is worse than an English title. So the card keeps its
 * identity in English, marked `lang="en"`, while the badge, the call to action,
 * the category, the date and the reading time stay localised.
 */
export interface LocalizedItem<T> {
  content: T | null;
  status: TranslationStatus;
  metadata: ItemMetadata;
}

/**
 * The collection a listing page renders from — always the full master list.
 *
 * This replaces a filtering version that was architecturally wrong. Filtering by
 * translation availability made the Telugu journal render zero cards and the
 * Telugu guides render one, so changing language changed the information
 * architecture. A reader who switches to Telugu expects the same site in another
 * language, not a smaller site.
 *
 * So the collection is never filtered. Every item comes back; those with an
 * overlay come back translated and marked `translated`, those without come back
 * as the English master marked `missing`. Status drives a badge and the card's
 * call to action — never its visibility.
 *
 * The overlays are loaded lazily and only for slugs that have one, so a locale
 * with no translations does no extra work beyond a map lookup per item.
 */
export async function getCollection<T extends { slug: string }>(
  kind: TranslationKind,
  items: readonly T[],
  locale: Locale
): Promise<LocalizedItem<T>[]> {
  /**
   * Card identity plus layout data.
   *
   * `card` supplies the text when this language has one; without it the English
   * strings come through and `textLocale` says so. The structural fields — slug,
   * category key, dates, reading time — always come from the English module,
   * because none of them is prose and duplicating them is how a Telugu page ends
   * up with a stale publish date.
   */
  const shell = (item: T, card?: CardTranslation | null): ItemMetadata => {
    const raw = item as unknown as {
      slug: string;
      title?: string;
      name?: string;
      excerpt?: string;
      epithet?: string;
      intro?: string;
      category?: string;
      published?: string;
      updated?: string;
      readingMinutes?: number;
    };
    return {
      slug: raw.slug,
      title: card?.title ?? raw.title ?? raw.name ?? raw.slug,
      // The shortest summary the collection offers, because this is a card. A
      // blog post has an `excerpt`, a location has a one-line `epithet`, a
      // guide has only a paragraph-length `intro`. Reaching for `intro` before
      // `epithet` would drop a whole paragraph under a location's name.
      excerpt: card?.excerpt ?? raw.excerpt ?? raw.epithet ?? raw.intro ?? "",
      textLocale: card ? locale : DEFAULT_LOCALE,
      category: raw.category,
      published: raw.published,
      updated: raw.updated,
      readingMinutes: raw.readingMinutes,
    };
  };

  if (locale === DEFAULT_LOCALE) {
    return items.map((content) => ({
      content,
      status: "translated" as const,
      metadata: shell(content),
    }));
  }

  // One import for the whole listing, not one per card: the card map is a
  // single module per (locale, kind), so a 72-card journal costs one chunk.
  const cards = await loadCards(kind, locale);

  return Promise.all(
    items.map(async (item): Promise<LocalizedItem<T>> => {
      const card = cards?.[item.slug] ?? null;
      const metadata = shell(item, card);

      if (isTranslated(kind, item.slug, locale)) {
        const overlay = await loadTranslation(kind, item.slug, locale);
        if (overlay) {
          // A body overlay carries its own headline and intro, and they win: a
          // fully translated article must not have its card text quietly
          // sourced from a card map that could disagree with the page it opens.
          const applied = applyOverlay(item, overlay);
          return {
            metadata: { ...shell(applied), textLocale: locale },
            content: applied,
            status: "translated",
          };
        }
      }

      // No body in this language. `content` stays null so no English prose can
      // reach the markup — but the metadata above may well be Telugu, and the
      // card renders from that.
      return { metadata, content: null, status: card ? "card" : "missing" };
    })
  );
}

/** Copy every field the overlay defines onto a clone of the source module. */
function applyOverlay<T extends { slug: string }>(source: T, overlay: ContentTranslation): T {
  const merged = { ...source } as Record<string, unknown>;
  for (const [key, value] of Object.entries(overlay)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    merged[key] = value;
  }
  return merged as T;
}

/**
 * Load the whole card map for one (locale, kind), or null when this language
 * has not started on that collection.
 */
export async function loadCards(
  kind: TranslationKind,
  locale: Locale
): Promise<Record<string, CardTranslation> | null> {
  if (locale === DEFAULT_LOCALE) return null;
  const loader = CARD_LOADERS[`${locale}:${kind}`];
  if (!loader) return null;
  try {
    return (await loader()).cards;
  } catch {
    return null;
  }
}

/** One card translation, for the single-article routes. */
export async function loadCardTranslation(
  kind: TranslationKind,
  slug: string,
  locale: Locale
): Promise<CardTranslation | null> {
  const cards = await loadCards(kind, locale);
  return cards?.[slug] ?? null;
}

/** Load one overlay, or null when the slug has not been translated yet. */
export async function loadTranslation(
  kind: TranslationKind,
  slug: string,
  locale: Locale
): Promise<ContentTranslation | null> {
  if (locale === DEFAULT_LOCALE) return null;
  const loader = LOADERS[`${locale}:${kind}:${slug}`];
  if (!loader) return null;
  try {
    return (await loader()).translation;
  } catch {
    // A malformed overlay must not take the route down. English is a correct
    // page; a 500 is not.
    return null;
  }
}

/**
 * Merge an overlay onto an English content module.
 *
 * Only keys the overlay actually defines are replaced, so a translator who has
 * done the title and the intro but not the body ships a page with a translated
 * title, a translated intro and an English body — degrading by paragraph rather
 * than by page.
 *
 * `translated` reports whether the *body* came across, because that is the flag
 * the reader-facing notice and the hreflang decision both turn on. A translated
 * headline over English prose is not a translated article.
 */
export async function resolveContent<T extends { slug: string }>(
  kind: TranslationKind,
  source: T,
  locale: Locale
): Promise<{ content: T; translated: boolean }> {
  if (locale === DEFAULT_LOCALE) return { content: source, translated: true };

  // The card layer first, so the tab title, the share card and the meta
  // description are in the reader's language even when the body is not. That is
  // the honest split: the *description of* the article is translated, the
  // article is not, and `translated` below still reports only the latter.
  const card = await loadCardTranslation(kind, source.slug, locale);
  const base = card ? applyOverlay(source, cardAsOverlay(card, kind)) : source;

  const overlay = await loadTranslation(kind, source.slug, locale);
  // No body overlay means this article does not exist in this language. The
  // caller is expected to have already excluded it; returning `translated:
  // false` here is what makes the page's guard fire rather than render English.
  if (!overlay) return { content: base, translated: false };

  return { content: applyOverlay(base, overlay), translated: true };
}

/**
 * A card translation expressed in overlay terms, per collection.
 *
 * The three collections disagree about what these fields are called, and the
 * mapping is written out explicitly rather than shotgunning every alias. An
 * earlier version wrote the card summary to `excerpt` *and* `intro` at once,
 * which is harmless for a blog post but wrong for a location: there `intro` is
 * the opening paragraph of the article, and a one-line card summary would
 * silently replace it on the detail page.
 *
 * So each kind states what its card's two strings actually are:
 *   blog      title  -> title,  excerpt -> excerpt
 *   guides    title  -> title,  excerpt -> intro    (a guide's card line is its intro)
 *   locations title  -> name,   excerpt -> epithet  (intro is left alone)
 */
function cardAsOverlay(card: CardTranslation, kind: TranslationKind): ContentTranslation {
  const meta = { metaTitle: card.metaTitle, metaDescription: card.metaDescription };

  switch (kind) {
    case "blog":
      return { ...meta, title: card.title, excerpt: card.excerpt };
    case "guides":
      return { ...meta, title: card.title, intro: card.excerpt };
    case "locations":
      return { ...meta, name: card.title, epithet: card.epithet ?? card.excerpt };
  }
}
