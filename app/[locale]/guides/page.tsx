import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { guides } from "@/content/guides";
import { getArticleIllustration } from "@/lib/illustrations";
import { breadcrumbSchema, collectionSchema, jsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";
import UntranslatedCard from "@/components/i18n/UntranslatedCard";
import { formatMonthYear } from "@/lib/i18n/format";
import { getCollection } from "@/lib/content/translated";
import { DEFAULT_LOCALE, localizePath } from "@/lib/i18n/config";

/**
 * Metadata has to be a function now, not a constant.
 *
 * A module-scope `const` cannot see `params`, so it cannot know which language
 * it is being rendered for — every locale would emit the English canonical and
 * the Telugu and Hindi pages would ask Google to drop them as duplicates.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslator(locale, ["metadata"]);

  return buildPageMetadata({
    title: t("metadata.guides.title"),
    description: t("metadata.guides.description"),
    path: "/guides",
    locale,
  });
}

export default async function GuidesIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, ["guides", "navigation", "common"]);

  // Only guides that exist in this language — see lib/content/translated.ts.
  // Never filtered — see lib/content/translated.ts. Every guide renders in every
  // language; only its text and badge differ.
  const collection = await getCollection("guides", guides, locale);
  // Sort by slug: the only ordering key that exists for every item in every
  // language. Sorting by title would put untranslated cards in a different
  // place than translated ones, which is a layout change by another name.
  const sorted = [...collection].sort((a, b) => a.metadata.slug.localeCompare(b.metadata.slug));
  /**
   * Every card stays inside the reader's language.
   *
   * This used to send untranslated guides to the English URL, which dropped the
   * reader out of Telugu entirely — header, navigation and footer all reverted
   * mid-journey, and the language they had chosen appeared to have been thrown
   * away. The article route now renders in-locale whatever the state of the
   * body, showing translated chrome around English prose with a notice, so the
   * link no longer has to leave.
   */
  const hrefFor = (slug: string) => localizePath(`/guides/${slug}`, locale);

  const untranslatedStrings = {
    badge: t("common.translationStatus.englishOnly"),
    cta: t("common.translationStatus.openEnglish"),
  };

  const featuredItem = sorted[0];
  const featuredStatus = featuredItem?.status ?? "missing";
  // Cards render from `metadata`, never from `content`. Metadata carries the
  // translated headline and summary the moment a card translation lands, while
  // `content` stays null until the body itself is translated.
  const featured = featuredStatus === "missing" ? undefined : featuredItem?.metadata;
  const remaining = sorted.slice(1);

  const tier = (index: number) =>
    index % 3 === 0
      ? t("guides.tier.essential")
      : index % 3 === 1
        ? t("guides.tier.deepDive")
        : t("guides.tier.legal");


  return (
    <>
      {/*
        CollectionPage + ItemList.
        Without it a hub page is just a wall of links, and an engine asked
        "what guides does Terravion publish?" has to infer the answer from
        markup. This states it: an ordered list, in reading order, in the
        reader's language.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            collectionSchema(
              {
                name: `${t("guides.headlineLead")} ${t("guides.headlineEmphasis")}`.trim(),
                description: t("guides.playbookIntro"),
                path: "/guides",
                // `sorted` — the same slug-ordered array the featured card and
                // the grid below read from, so the structured list and the
                // visible list can never disagree. `metadata.title` is the
                // localised headline; untranslated items still have a page in
                // this locale, so no entry here points at a 404.
                items: sorted.map((item) => ({
                  name: item.metadata.title,
                  path: `/guides/${item.metadata.slug}`,
                })),
              },
              locale
            )
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("navigation.guides"), path: "/guides" },
            ])
          ),
        }}
      />
      <section className="bg-ivory pb-36 pt-40 md:pb-48 md:pt-52">
        <div className="mx-auto max-w-[1500px] px-6 md:px-12">
          {/* Header */}
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <p className="label text-gold-ink">{t("guides.eyebrowPlaybooks")}</p>
            </div>
            <h1 className="display mt-6 max-w-4xl text-4xl leading-[0.98] text-charcoal md:text-7xl lg:text-8xl">
              {t("guides.headlineLead")} <br />
              <em className="text-gold-ink">{t("guides.headlineEmphasis")}</em>
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-stone-grey md:text-xl">
              {t("guides.playbookIntro")}
            </p>
          </Reveal>

          {/* Featured Guide — 65/35 Hero Card */}
          {featuredItem && featuredStatus === "missing" && (
            <Reveal className="mt-16">
              <p className="label mb-6 text-stone-grey">{t("guides.featuredPlaybook")}</p>
              <UntranslatedCard
                slug={featuredItem.metadata.slug}
                title={featuredItem.metadata.title}
                excerpt={featuredItem.metadata.excerpt}
                englishHref={localizePath(`/guides/${featuredItem.metadata.slug}`, DEFAULT_LOCALE)}
                dateLabel={featuredItem.metadata.updated ? formatMonthYear(featuredItem.metadata.updated, locale) : undefined}
                strings={untranslatedStrings}
                featured
              />
            </Reveal>
          )}

          {featured && (
            <Reveal className="mt-16">
              <p className="label mb-6 text-stone-grey">{t("guides.featuredPlaybook")}</p>
              <Link
                href={hrefFor(featured.slug)}
                className="group grid overflow-hidden rounded-3xl border border-gold/25 bg-white shadow-lg transition-all duration-700 hover:border-gold/60 hover:shadow-2xl hover:shadow-gold/10 lg:grid-cols-12"
              >
                {/* Image Occupies 65% of Card (8 cols) */}
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
                      {t("guides.guideNumber", { number: "01" })}
                    </span>
                  </div>
                </div>

                {/* Text Occupies 35% of Card (5 cols) */}
                <div className="flex flex-col justify-between p-8 md:p-12 lg:col-span-5">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-stone-grey">
                      <span className="rounded-md border border-gold/25 bg-sand/30 px-2.5 py-1 font-semibold uppercase text-gold-ink">
                        {t("guides.tier.essential")}
                      </span>
                      <span>·</span>
                      <span className="font-mono">
                        {t("common.readingTime", { minutes: 10 })}
                      </span>
                    </div>
                    <h2 className="display mt-6 text-3xl leading-tight text-charcoal transition-colors duration-300 group-hover:text-gold-ink md:text-4xl lg:text-5xl">
                      <span lang={featured.textLocale === locale ? undefined : featured.textLocale}>
                        {featured.title}
                      </span>
                      {featuredStatus !== "translated" && (
                        <span className="ms-3 align-middle rounded-full px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em]" style={{ background: "#F1EBE2", color: "#8A6736" }}>
                          {t("common.translationStatus.missing")}
                        </span>
                      )}
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-stone-grey">
                      <span lang={featured.textLocale === locale ? undefined : featured.textLocale}>
                        {featured.excerpt}
                      </span>
                    </p>
                  </div>

                  <div className="mt-10 flex items-center justify-between border-t border-gold/15 pt-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-charcoal group-hover:text-gold-ink">
                      {t("guides.readPlaybookCta")}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold-ink transition-transform duration-500 group-hover:translate-x-1.5 group-hover:bg-gold group-hover:text-charcoal">
                      →
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          )}

          {/* Staggered Vertical Card Grid */}
          <div className="mt-24 space-y-12">
            <div className="flex items-center justify-between border-b border-gold/20 pb-4">
              <h2 className="label text-gold-ink">{t("guides.allPlaybooks")}</h2>
              <span className="font-mono text-xs text-stone-grey">
                {t("guides.guidesCount", { count: remaining.length })}
              </span>
            </div>

            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {remaining.map((item, i) => {
                const { metadata: g, status } = item;

                // Nothing at all in this language yet: the English-identity card,
                // which marks its own title and summary `lang="en"`.
                if (status === "missing") {
                  return (
                    <Reveal key={item.metadata.slug} delay={(i % 3) * 0.06}>
                      <UntranslatedCard
                        slug={item.metadata.slug}
                        title={item.metadata.title}
                        excerpt={item.metadata.excerpt}
                        englishHref={localizePath(`/guides/${item.metadata.slug}`, DEFAULT_LOCALE)}
                        dateLabel={item.metadata.updated ? formatMonthYear(item.metadata.updated, locale) : undefined}
                        strings={untranslatedStrings}
                      />
                    </Reveal>
                  );
                }

                const imageSrc = getArticleIllustration(g.slug);
                const difficulty = tier(i);
                return (
                  <Reveal key={g.slug} delay={(i % 3) * 0.06}>
                    <Link
                      href={hrefFor(g.slug)}
                      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gold/20 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-xl hover:shadow-gold/10"
                      style={{
                        marginTop: i % 3 === 1 ? "1.5rem" : i % 3 === 2 ? "3rem" : "0rem",
                      }}
                    >
                      {/* 65% Image Height */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-travertine">
                        <Image
                          src={imageSrc}
                          alt={g.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="absolute left-4 top-4 rounded-full border border-white/40 bg-ivory/90 px-3 py-1 backdrop-blur-md">
                          <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-charcoal">
                            {t("guides.guideNumber", { number: String(i + 2).padStart(2, "0") })}
                          </span>
                        </div>
                      </div>

                      {/* 35% Text */}
                      <div className="flex flex-1 flex-col justify-between p-7 md:p-8">
                        <div>
                          <div className="flex items-center justify-between text-xs text-stone-grey">
                            <span className="rounded border border-gold/20 bg-sand/20 px-2 py-0.5 font-semibold text-gold-ink">
                              {difficulty}
                            </span>
                            <span className="font-mono text-stone-grey/70">
                              {t("common.updatedOn", {
                                date: g.updated ? formatMonthYear(g.updated, locale) : "",
                              })}
                            </span>
                          </div>
                          <h3 className="display mt-4 text-2xl leading-snug text-charcoal transition-colors duration-300 group-hover:text-gold-ink">
                            <span lang={g.textLocale === locale ? undefined : g.textLocale}>{g.title}</span>
                            {status !== "translated" && (
                              <span className="ms-2 align-middle rounded-full px-2.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.14em]" style={{ background: "#F1EBE2", color: "#8A6736" }}>
                                {t("common.translationStatus.missing")}
                              </span>
                            )}
                          </h3>
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-grey">
                            <span lang={g.textLocale === locale ? undefined : g.textLocale}>{g.excerpt}</span>
                          </p>
                        </div>

                        <div className="mt-8 flex items-center justify-between border-t border-gold/10 pt-5">
                          <span className="text-xs font-semibold tracking-wider text-stone-grey transition-colors group-hover:text-charcoal">
                            {t("guides.readPlaybookCta")}
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 bg-ivory text-gold-ink transition-all duration-400 group-hover:translate-x-1 group-hover:border-gold group-hover:bg-gold group-hover:text-charcoal">
                            →
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
