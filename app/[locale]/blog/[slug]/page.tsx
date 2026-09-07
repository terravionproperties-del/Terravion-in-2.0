import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import Faq from "@/components/ui/Faq";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import VisualStoryRenderer from "@/components/journal/VisualStoryRenderer";
import { posts, getBySlug } from "@/content/blog";
import { extractToc } from "@/lib/markdown";
import { getArticleIllustration } from "@/lib/illustrations";
import { articleSchema, faqSchema, breadcrumbSchema, jsonLd } from "@/lib/schema";
import ArticleSummary from "@/components/article/ArticleSummary";
import ArticleByline from "@/components/article/ArticleByline";
import { site } from "@/lib/site";
import { buildArticleMetadata } from "@/lib/seo";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";
import { formatDate } from "@/lib/i18n/format";
import {
  availableLocalesFor,
  resolveContent,
} from "@/lib/content/translated";
import TranslationNotice from "@/components/i18n/TranslationNotice";

/**
 * Only the slugs that exist in this language.
 *
 * Next passes the parent segment's params in, so this runs once per locale. For
 * English that is every article; for Telugu and Hindi it is the translated
 * subset, which is what stops an untranslated essay from being built at all.
 * Combined with `dynamicParams = false` on the locale layout, an untranslated
 * URL 404s instead of serving English under a Telugu header.
 */
export function generateStaticParams() {
  // Every slug, for every locale — deliberately not filtered.
  //
  // Returning only the translated subset looked right and was wrong: when a
  // nested `generateStaticParams` returns an empty array for one parent param,
  // Next drops *every* page for that route, including the parent params that
  // returned a full list. `guides` survived only because it had one translated
  // slug in each language; `blog` and `locations` returned [] for te and hi and
  // lost all 72 and 13 English pages with them.
  //
  // So the exclusion happens one layer down instead: the page component calls
  // `notFound()` when the locale has no translated body, which prerenders a real
  // 404 for /te/blog/<untranslated>. Same visitor-facing behaviour — an
  // untranslated article does not exist in Telugu — reached by a route Next
  // actually supports.
  return posts.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const src = getBySlug(slug);
  if (!src) return {};

  // Resolve through the overlay so the tab title, the share card and the meta
  // description are in the same language as the body underneath them. Reading
  // the English module here was the defect: a fully translated Telugu page
  // still announced itself in English to Google and to anyone sharing the link.
  const { content: p, translated } = await resolveContent("blog", src, locale);
  return buildArticleMetadata({
    locale,
    availableLocales: availableLocalesFor("blog", slug),
    // The page renders in-locale even when the prose is still English. When it
    // is, the English URL is the canonical one — otherwise two URLs would offer
    // Google the same body text.
    canonicalLocale: translated ? locale : DEFAULT_LOCALE,
    slug: p.slug,
    title: p.title,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    keywords: p.keywords,
    publishedAt: p.published,
    updatedAt: p.updated,
    category: p.category,
    author: site.name,
  });
}

function getDifficulty(readingMinutes: number): string {
  if (readingMinutes <= 5) return "Essential Story";
  if (readingMinutes <= 10) return "Deep Exploration";
  return "Masterclass Thesis";
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}) {
  const { slug, locale } = await params;
  const source = getBySlug(slug);
  if (!source) notFound();

  // The overlay replaces only the prose it defines; dates, category and every
  // illustration reference stay on the English module.
  // An untranslated body no longer dead-ends. See the note in
  // `app/[locale]/guides/[slug]/page.tsx` — the stub that used to live here
  // gave the reader a "coming soon" page with no essay on it, and the listing
  // routed around it by linking at the English URL, which threw them out of
  // their language. The page now always renders, with the English prose marked
  // `lang="en"` beneath a notice.

  const { content: p, translated } = await resolveContent("blog", source, locale);
  const tt = await getTranslator(locale, ["common", "navigation", "journal"]);

  const storyStrings = {
    chapter: tt("common.article.chapter"),
    chapterCount: tt("common.article.chapterCount"),
    storybookFormat: tt("common.article.storybookFormat"),
    todaysStory: tt("common.article.todaysStory"),
    storySummaryAria: tt("common.article.storySummaryAria"),
    verifiedData: tt("common.article.verifiedData"),
    timeline: tt("common.article.timeline"),
    conclusion: tt("common.article.conclusion"),
    expertInsight: tt("common.article.expertInsight"),
  };

  const toc = extractToc(p.body);
  const heroIllustration = getArticleIllustration(p.slug);
  const difficulty = getDifficulty(p.readingMinutes);
  const related = posts
    .filter((x) => x.slug !== p.slug && x.category === p.category)
    .slice(0, 3);

  return (
    <>
      {/* Sticky top reading progress bar */}
      <ReadingProgressBar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(articleSchema(p, locale, "/blog")),
        }}
      />
      {p.faqs && p.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema([...p.faqs])) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Journal", path: "/blog" },
              { name: p.title, path: `/blog/${p.slug}` },
            ])
          ),
        }}
      />

      <article className="bg-ivory pb-32 pt-36 md:pb-48 md:pt-48">
        {/* Editorial Header */}
        <header className="mx-auto max-w-4xl px-6 md:px-10">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <p className="label text-gold-ink">
                <Link href={localizePath("/blog", locale)} className="hover:underline">
                  {tt("journal.eyebrow")}
                </Link>{" "}
                · {p.category}
              </p>
            </div>

            <h1 className="display mt-6 text-4xl leading-[0.98] text-charcoal md:text-6xl lg:text-7xl">
              {p.title}
            </h1>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-gold/15 py-5 text-xs text-stone-grey">
              <div className="flex items-center gap-4">
                <span className="font-semibold uppercase tracking-wider text-charcoal">
                  {tt("common.article.byline")}
                </span>
                <span>·</span>
                <span className="rounded border border-gold/25 bg-sand/30 px-2.5 py-1 font-semibold text-gold-ink">
                  {difficulty}
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono text-stone-grey/70">
                <span>
                  {tt("common.updatedOn", { date: formatDate(p.updated, locale) })}
                </span>
                <span>·</span>
                <span>{tt("journal.minRead", { minutes: p.readingMinutes })}</span>
              </div>
            </div>
          </Reveal>
        </header>

        {/* Complete Rectangle 16:9 Hero Banner — Edge-to-Edge Fill */}
        <div className="mx-auto mt-10 w-full max-w-4xl px-6">
          <Reveal>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-gold/25 shadow-xl shadow-gold/5">
              <Image
                src={heroIllustration}
                alt={p.title}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 896px"
              />
              <div className="absolute bottom-4 right-4 rounded-full border border-white/40 bg-ivory/85 px-4 py-1.5 backdrop-blur-md">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-charcoal">
                  {tt("common.article.conceptBreakdown")}
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Storybook Body & Sticky Sidebar */}
        <div className="mx-auto mt-16 grid max-w-[1400px] gap-14 px-6 md:grid-cols-[1fr_20rem] md:px-10">
          <Reveal className="min-w-0">
            {!translated && (
              <TranslationNotice
                locale={locale}
                path={`/blog/${slug}`}
                title={tt("common.translation.notAvailableTitle")}
                body={tt("common.translation.notAvailableBody", {
                  language: tt("common.language.label"),
                })}
                readInEnglish={tt("common.translation.readInEnglish")}
              />
            )}

            {/* Answer-first summary. Also the element the speakable schema
                points at — see components/article/ArticleSummary.tsx. */}
            <ArticleSummary
              summary={p.excerpt}
              summaryLabel={tt("common.article.summaryLabel")}
              takeawaysLabel={tt("common.article.takeawaysLabel")}
              lang={translated ? undefined : DEFAULT_LOCALE}
            />

            {/* Visual Storybook Renderer.
                `lang` marks the prose when the body is still English inside a
                Telugu or Hindi page: a screen reader switches voice instead of
                reading English words with Telugu phonetics, and the browser
                stops treating the page as wholly one language. */}
            <div lang={translated ? undefined : DEFAULT_LOCALE}>
            <VisualStoryRenderer
              strings={storyStrings}
              slug={p.slug}
              title={p.title}
              excerpt={p.excerpt}
              bodyMd={p.body}
              category={p.category}
              locale={locale}
            />
            </div>

            {/* FAQ Section */}
            {p.faqs && p.faqs.length > 0 && (
              <section aria-label={tt("common.article.faqAria")} className="mt-20 border-t border-gold/15 pt-12">
                <h2 className="display text-3xl text-charcoal md:text-4xl">
                  Frequently Asked Questions
                </h2>
                <div className="mt-8">
                  <Faq items={[...p.faqs]} />
                </div>
              </section>
            )}

            {/* Visible E-E-A-T. Renders the organisation unless a verified
                human author is registered — never an invented credential. */}
            <ArticleByline
              writtenByLabel={tt("common.article.writtenBy")}
              reviewedByLabel={tt("common.article.reviewedBy")}
              updatedLabel={tt("common.updatedOn", {
                date: formatDate(p.updated, locale),
              })}
            />
          </Reveal>

          {/* Sticky Sidebar Rail */}
          <aside className="hidden md:block">
            <div className="sticky top-28 flex flex-col gap-8">
              {toc.length > 1 && (
                <nav aria-label={tt("common.article.chapterNav")} className="rounded-2xl border border-gold/20 bg-white/80 p-6 shadow-sm">
                  <p className="label text-gold-ink">{tt("common.article.storyNav")}</p>
                  <ul className="mt-4 space-y-3 border-s border-gold/15 ps-4">
                    {toc.map((t, i) => (
                      <li key={`${t.id}-${i}`}>
                        <a
                          href={`#${t.id}`}
                          className="block text-xs font-medium leading-snug text-stone-grey transition-colors hover:text-gold-ink"
                        >
                          {t.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              <div className="rounded-2xl border border-gold/25 bg-travertine p-8 text-charcoal shadow-md">
                <p className="label text-gold-ink">{tt("common.article.experienceCentre")}</p>
                <p className="display mt-3 text-2xl leading-snug">
                  Reading about land is good. Standing on it is better.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                  Book a private site tour in Shankarpally with complimentary AC cab pickup from Financial District.
                </p>
                <Link
                  href={localizePath("/site-visit", locale)}
                  className="btn-gold mt-6 inline-block w-full text-center !text-charcoal"
                >
                  Book Site Visit
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Visual Stories */}
        {related.length > 0 && (
          <section aria-label={tt("common.article.relatedAria")} className="mx-auto mt-32 max-w-[1400px] border-t border-gold/15 px-6 pt-20 md:px-10">
            <Reveal>
              <p className="label text-gold-ink">{tt("common.article.exploreNext")}</p>
              <h2 className="display mt-4 text-3xl text-charcoal md:text-5xl">
                Related Visual Stories
              </h2>
              <div className="mt-10 grid gap-8 md:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-travertine">
                      <Image
                        src={getArticleIllustration(r.slug)}
                        alt={r.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-6">
                      <p className="label text-xs text-gold-ink">{r.category}</p>
                      <h3 className="display mt-3 text-xl leading-snug text-charcoal transition-colors group-hover:text-gold-ink">
                        {r.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          </section>
        )}
      </article>
    </>
  );
}
