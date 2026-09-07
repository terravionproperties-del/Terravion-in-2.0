import type { Metadata } from "next";
import JournalIndex from "@/components/journal/JournalIndex";
import { posts } from "@/content/blog";
import { breadcrumbSchema, collectionSchema, jsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";
import { getCollection } from "@/lib/content/translated";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslator(locale, ["metadata"]);

  return buildPageMetadata({
    title: t("metadata.journal.title"),
    description: t("metadata.journal.description"),
    path: "/blog",
    locale,
  });
}

/**
 * The journal index.
 *
 * The listing shows only essays that exist in the reader's language. That is a
 * deliberate consequence of the no-English-fallback rule: an untranslated essay
 * has no Telugu URL, so linking to it from a Telugu index would be linking at a
 * 404. Below a certain coverage the Telugu index is mostly an invitation to read
 * the English original — and it says so, in Telugu.
 */
export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, ["journal", "navigation", "common"]);

  // The full master collection, always. Items without a translation come back
  // as the English master carrying status "missing" — the card still renders,
  // with a badge and an English call to action. Changing language must never
  // change how many cards exist.
  const collection = await getCollection("blog", posts, locale);
  // Sort on the shell, never on content — an untranslated item has no content.
  const sorted = [...collection].sort((a, b) =>
    (a.metadata.published ?? "") < (b.metadata.published ?? "") ? 1 : -1
  );

  const CATEGORIES = [
    "Investment",
    "Locations",
    "Guides",
    "Market Trends",
    "Lifestyle",
    "Infrastructure",
    "Legal & Tax",
  ] as const;

  const strings = {
    eyebrow: t("journal.eyebrow"),
    headlineLead: t("journal.headline.lead"),
    headlineEmphasis: t("journal.headline.emphasis"),
    essayCount: t("journal.essayCount", { count: sorted.length }),
    status: {
      missing: t("common.translationStatus.missing"),
      readInEnglish: t("common.translationStatus.readInEnglish"),
    },
    featuredLabel: t("journal.featuredLabel"),
    allStories: t("journal.allStories"),
    readStory: t("journal.readStory"),
    minRead: t("journal.minRead"),
    categoryAll: t("journal.categories.all"),
    categories: Object.fromEntries(
      CATEGORIES.map((c) => [c, t(`journal.categories.${c}`)])
    ) as Record<string, string>,
    difficulty: {
      essential: t("journal.difficulty.essential"),
      deepDive: t("journal.difficulty.deepDive"),
      masterclass: t("journal.difficulty.masterclass"),
    },
    empty: {
      title: t("journal.empty.title"),
      body: t("journal.empty.body", { language: t("common.language.label") }),
      action: t("journal.empty.action"),
    },
    storiesCount: t("journal.storiesCount"),
    featuredAria: t("journal.featuredAria"),
    libraryAria: t("journal.libraryAria"),
    englishHref: localizePath("/blog", DEFAULT_LOCALE),
  };

  return (
    <>
      {/*
        CollectionPage + ItemList.
        Without it a hub page is just a wall of links, and an engine asked
        "what does Terravion publish?" has to infer the answer from markup.
        This states it: an ordered list, in reading order, in the reader's
        language. The strings are the ones the header actually renders, so the
        structured page and the visible page cannot disagree.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            collectionSchema(
              {
                name: `${strings.headlineLead} ${strings.headlineEmphasis}`.trim(),
                description: strings.essayCount,
                path: "/blog",
                // `sorted`, not `collection` — the same array JournalIndex
                // receives, so the list order matches the cards on screen.
                // `metadata.title` is the localised headline; `content` may
                // still be null, but the route renders in-locale regardless,
                // so every slug here has a page in this language.
                items: sorted.map((item) => ({
                  name: item.metadata.title,
                  path: `/blog/${item.metadata.slug}`,
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
            breadcrumbSchema(
              [
                { name: t("navigation.home"), path: "/" },
                { name: t("navigation.journal"), path: "/blog" },
              ],
              locale
            )
          ),
        }}
      />
      <JournalIndex items={sorted} locale={locale} strings={strings} />
    </>
  );
}
