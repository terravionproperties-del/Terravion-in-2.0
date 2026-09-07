"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/types";
import { getArticleIllustration } from "@/lib/illustrations";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n/config";
import type { LocalizedItem } from "@/lib/content/translated";
import UntranslatedCard from "@/components/i18n/UntranslatedCard";

/**
 * The Terravion Journal — A Luxury Visual Storytelling Salon
 * Every article card features a 65/35 split with 100% dedicated 3D Pixar editorial artwork,
 * difficulty badges, golden hover animations, and high-contrast charcoal typography.
 */

export interface JournalStrings {
  eyebrow: string;
  headlineLead: string;
  headlineEmphasis: string;
  essayCount: string;
  featuredLabel: string;
  allStories: string;
  readStory: string;
  minRead: string;
  categoryAll: string;
  /** Category display names, keyed by the English category value. */
  categories: Record<string, string>;
  difficulty: { essential: string; deepDive: string; masterclass: string };
  empty: { title: string; body: string; action: string };
  status: { missing: string; readInEnglish: string };
  storiesCount: string;
  featuredAria: string;
  libraryAria: string;
  englishHref: string;
}

export default function JournalIndex({
  items,
  locale,
  strings,
}: {
  /** The full master collection — every essay, translated or not. */
  items: LocalizedItem<BlogPost>[];
  locale: Locale;
  strings: JournalStrings;
}) {
  // The grid iterates items, not posts. An untranslated item has content: null
  // — the English object is never in scope, so it cannot reach the markup.
  const statusOf = new Map(items.map((i) => [i.metadata.slug, i.status]));
  /** The language each card's own title and summary are written in. */
  const textLocaleOf = new Map(items.map((i) => [i.metadata.slug, i.metadata.textLocale]));

  /**
   * Where a card points.
   *
   * An untranslated article has no page in this locale — the route 404s by
   * design. Linking a visible card at a 404 would be a worse bug than the one
   * this file just fixed, so those cards point at the English original instead.
   * The card stays; only its destination and its badge differ.
   */
  /**
   * The BCP-47 tag for an item's own prose.
   *
   * A card whose article has no translation shows English title and summary
   * inside a Telugu page. That is the state this design chose over hiding the
   * card — but leaving the span unmarked is wrong regardless: a screen reader
   * announces English words with Telugu phonetics, and the browser offers to
   * translate a page it thinks is entirely Telugu. `lang` on the element makes
   * the mixture explicit to every consumer instead of implicit.
   */
  const langFor = (slug: string) => {
    const text = textLocaleOf.get(slug);
    return text && text !== locale ? text : undefined;
  };

  // Every card stays inside the reader's language. Sending untranslated essays
  // to the English URL dropped the reader out of Telugu mid-journey — header,
  // navigation and footer all reverted, and the language they had chosen looked
  // like it had been discarded. The article route now renders in-locale
  // whatever the state of the body.
  const hrefFor = (slug: string) => localizePath(`/blog/${slug}`, locale);
  const ALL = "__all__";
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL);

  const getDifficulty = (readingMinutes: number): string => {
    if (readingMinutes <= 5) return strings.difficulty.essential;
    if (readingMinutes <= 10) return strings.difficulty.deepDive;
    return strings.difficulty.masterclass;
  };

  // The category *value* stays English because it is the data key; only the
  // label is translated. Filtering on a translated label would break the moment
  // two languages disagree about capitalisation.
  const categories = [ALL, ...Array.from(new Set(items.map((i) => i.metadata.category ?? "")))].filter(Boolean);
  const categoryLabel = (c: string) =>
    c === ALL ? strings.categoryAll : (strings.categories[c] ?? c);

  const filteredItems =
    selectedCategory === ALL
      ? items
      : items.filter((i) => i.metadata.category === selectedCategory);

  const featuredItem = filteredItems[0];
  // Cards render from `metadata`, never from `content`: metadata carries the
  // translated headline and summary as soon as a card translation lands, while
  // `content` stays null until the body itself is translated.
  const featured = featuredItem && featuredItem.status !== "missing" ? featuredItem.metadata : null;
  const remaining = filteredItems.slice(1);

  const untranslatedStrings = { badge: strings.status.missing, cta: strings.status.readInEnglish };

  const englishHrefFor = (slug: string) => localizePath(`/blog/${slug}`, DEFAULT_LOCALE);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-ivory pb-36 pt-40 md:pt-52">
        <div className="mx-auto max-w-[1500px] px-6 md:px-12">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <p className="label text-gold-ink">{strings.eyebrow}</p>
          </div>
          <h1 className="display mt-6 max-w-3xl text-4xl leading-[1.02] text-charcoal md:text-6xl">
            {strings.empty.title}
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-stone-grey md:text-lg">
            {strings.empty.body}
          </p>
          <Link
            href={strings.englishHref}
            hrefLang="en-IN"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-gold-ink"
          >
            {strings.empty.action}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory pb-36 pt-40 md:pt-52">
      <div className="mx-auto max-w-[1500px] px-6 md:px-12">
        {/* Header section */}
        <header className="max-w-4xl">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <p className="label text-gold-ink">{strings.eyebrow}</p>
          </div>
          <h1 className="display mt-6 text-4xl leading-[0.98] text-charcoal md:text-7xl lg:text-8xl">
            {strings.headlineLead} <br />
            <em className="text-gold-ink">{strings.headlineEmphasis}</em>
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-stone-grey md:text-xl">
            {strings.essayCount}
          </p>
        </header>

        {/* Category Pills Bar */}
        <div className="mt-16 flex flex-wrap items-center gap-3 border-b border-gold/15 pb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all duration-400 ${
                selectedCategory === cat
                  ? "bg-gold text-charcoal shadow-md shadow-gold/15"
                  : "border border-gold/20 bg-ivory/80 text-stone-grey hover:border-gold/50 hover:text-charcoal"
              }`}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Featured Story — Hero 65/35 Split Card */}
        {featuredItem && featuredItem.status === "missing" && (
          <section className="mt-16" aria-label={strings.featuredAria}>
            <p className="label mb-6 text-stone-grey">{strings.featuredLabel}</p>
            <UntranslatedCard
              slug={featuredItem.metadata.slug}
              title={featuredItem.metadata.title}
              excerpt={featuredItem.metadata.excerpt}
              englishHref={englishHrefFor(featuredItem.metadata.slug)}
              categoryLabel={featuredItem.metadata.category ? categoryLabel(featuredItem.metadata.category) : undefined}
              readingLabel={strings.minRead.replace("{minutes}", String(featuredItem.metadata.readingMinutes ?? ""))}
              strings={untranslatedStrings}
              featured
            />
          </section>
        )}

        {featured && (
          <section className="mt-16" aria-label={strings.featuredAria}>
            <p className="label mb-6 text-stone-grey">{strings.featuredLabel}</p>
            <Link
              href={hrefFor(featured.slug)}
              className="group grid overflow-hidden rounded-3xl border border-gold/25 bg-white shadow-lg transition-all duration-700 hover:border-gold/60 hover:shadow-2xl hover:shadow-gold/10 lg:grid-cols-12"
            >
              {/* Image Occupies 65% of Card (7 cols in 12 grid) */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-travertine lg:col-span-7 lg:aspect-auto lg:min-h-[460px]">
                <Image
                  src={getArticleIllustration(featured.slug)}
                  alt={featured.title}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/40 bg-ivory/90 px-4 py-1.5 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-charcoal">
                    {featured.category ? categoryLabel(featured.category) : ""}
                  </span>
                </div>
              </div>

              {/* Text Occupies 35% of Card (5 cols in 12 grid) */}
              <div className="flex flex-col justify-between p-8 md:p-12 lg:col-span-5">
                <div>
                  <div className="flex items-center gap-3 text-xs text-stone-grey">
                    <span className="rounded-md border border-gold/25 bg-sand/30 px-2.5 py-1 font-semibold uppercase text-gold-ink">
                      {getDifficulty(featured.readingMinutes ?? 0)}
                    </span>
                    <span>·</span>
                    <span className="font-mono">{strings.minRead.replace("{minutes}", String(featured.readingMinutes ?? ""))}</span>
                  </div>
                  <h2 className="display mt-6 text-3xl leading-tight text-charcoal transition-colors duration-300 group-hover:text-gold-ink md:text-4xl lg:text-5xl">
                    <span lang={langFor(featured.slug)}>{featured.title}</span>
                    {statusOf.get(featured.slug) !== "translated" && (
                      <span
                        className="ms-3 align-middle rounded-full px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em]"
                        style={{ background: "#F1EBE2", color: "#8A6736" }}
                      >
                        {strings.status.missing}
                      </span>
                    )}
                  </h2>
                  <p className="mt-5 text-base leading-relaxed text-stone-grey">
                    <span lang={langFor(featured.slug)}>{featured.excerpt}</span>
                  </p>
                </div>

                <div className="mt-10 flex items-center justify-between border-t border-gold/15 pt-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-charcoal group-hover:text-gold-ink">
                    {strings.readStory}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold-ink transition-transform duration-500 group-hover:translate-x-1.5 group-hover:bg-gold group-hover:text-charcoal">
                    →
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Vertical Card Grid with 3D Pixar Renders */}
        <section className="mt-24 space-y-12" aria-label={strings.libraryAria}>
          <div className="flex items-center justify-between border-b border-gold/20 pb-4">
            <h2 className="label text-gold-ink">{strings.allStories}</h2>
            <span className="font-mono text-xs text-stone-grey">
              {strings.storiesCount.replace("{count}", String(remaining.length))}
            </span>
          </div>

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {remaining.map((item) => {
              const p = item.metadata;
              if (item.status === "missing") {
                return (
                  <UntranslatedCard
                    key={item.metadata.slug}
                    slug={item.metadata.slug}
                    title={item.metadata.title}
                    excerpt={item.metadata.excerpt}
                    englishHref={englishHrefFor(item.metadata.slug)}
                    categoryLabel={item.metadata.category ? categoryLabel(item.metadata.category) : undefined}
                    readingLabel={strings.minRead.replace("{minutes}", String(item.metadata.readingMinutes ?? ""))}
                    strings={untranslatedStrings}
                  />
                );
              }
              const imageSrc = getArticleIllustration(p.slug);
              const difficulty = getDifficulty(p.readingMinutes ?? 0);
              return (
                <Link
                  key={p.slug}
                  href={hrefFor(p.slug)}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-gold/20 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-xl hover:shadow-gold/10"
                >
                  {/* 3D Pixar Image Container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-travertine">
                    <Image
                      src={imageSrc}
                      alt={p.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute left-4 top-4 rounded-full border border-white/40 bg-ivory/90 px-3 py-1 backdrop-blur-md">
                      <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-charcoal">
                        {p.category ? categoryLabel(p.category) : ""}
                      </span>
                    </div>
                  </div>

                  {/* Text Container */}
                  <div className="flex flex-1 flex-col justify-between p-7 md:p-8">
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-grey">
                        <span className="rounded border border-gold/20 bg-sand/20 px-2 py-0.5 font-semibold text-gold-ink">
                          {difficulty}
                        </span>
                        <span className="font-mono text-stone-grey/70">
                          {strings.minRead.replace("{minutes}", String(p.readingMinutes ?? ""))}
                        </span>
                      </div>

                      <h3 className="display mt-4 text-2xl leading-snug text-charcoal transition-colors duration-300 group-hover:text-gold-ink">
                        <span lang={langFor(p.slug)}>{p.title}</span>
                        {statusOf.get(p.slug) !== "translated" && (
                          <span
                            className="ms-2 align-middle rounded-full px-2.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.14em]"
                            style={{ background: "#F1EBE2", color: "#8A6736" }}
                          >
                            {strings.status.missing}
                          </span>
                        )}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-grey">
                        <span lang={langFor(p.slug)}>{p.excerpt}</span>
                      </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-gold/10 pt-5">
                      <span className="text-xs font-semibold tracking-wider text-stone-grey transition-colors group-hover:text-charcoal">
                        {strings.readStory}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 bg-ivory text-gold-ink transition-all duration-400 group-hover:translate-x-1 group-hover:border-gold group-hover:bg-gold group-hover:text-charcoal">
                        →
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

