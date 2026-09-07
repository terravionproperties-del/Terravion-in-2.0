import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import Faq from "@/components/ui/Faq";
import LeadForm from "@/components/forms/LeadForm";
import { leadFormStrings } from "@/lib/i18n/lead-form";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import VisualStoryRenderer from "@/components/journal/VisualStoryRenderer";
import { guides, getBySlug } from "@/content/guides";
import { extractToc } from "@/lib/markdown";
import { getArticleIllustration } from "@/lib/illustrations";
import { articleSchema, faqSchema, breadcrumbSchema, jsonLd } from "@/lib/schema";
import { buildGuideMetadata } from "@/lib/seo";
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
  return guides.map((g) => ({ slug: g.slug }));
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
  const { content: g, translated } = await resolveContent("guides", src, locale);

  return buildGuideMetadata({
    locale,
    availableLocales: availableLocalesFor("guides", slug),
    // The page renders in-locale even when the prose is still English. When it
    // is, the English URL is the canonical one — otherwise two URLs would offer
    // Google the same body text.
    canonicalLocale: translated ? locale : DEFAULT_LOCALE,
    slug: g.slug,
    title: g.title,
    metaTitle: g.metaTitle,
    metaDescription: g.metaDescription,
    keywords: g.keywords,
    updatedAt: g.updated,
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}) {
  const { slug, locale } = await params;
  const formStrings = await leadFormStrings(locale);
  const source = getBySlug(slug);
  if (!source) notFound();

  // The overlay replaces only the prose it defines; dates, category and every
  // illustration reference stay on the English module.
  // An untranslated body no longer dead-ends.
  //
  // This used to return a stub — a localised "coming soon" page with no article
  // on it — and the listing routed around that stub by linking at the English
  // URL instead, which threw the reader out of their language entirely. Both
  // halves of that were wrong. The page now always renders: localised chrome,
  // localised headline and summary from the card translation, and the English
  // prose marked `lang="en"` beneath a notice that says so. The reader keeps
  // their language and still gets the article.

  const { content: g, translated } = await resolveContent("guides", source, locale);
  const tt = await getTranslator(locale, ["common", "navigation", "guides"]);

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

  const toc = extractToc(g.body);
  const heroIllustration = getArticleIllustration(g.slug);

  return (
    <>
      {/* Sticky top reading progress bar */}
      <ReadingProgressBar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            articleSchema(
              {
                slug: g.slug,
                title: g.title,
                metaDescription: g.metaDescription,
                updated: g.updated,
              },
              locale,
              "/guides"
            )
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema([...g.faqs])) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Buyer Guides", path: "/guides" },
              { name: g.title, path: `/guides/${g.slug}` },
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
                <Link href={localizePath("/guides", locale)} className="hover:underline">
                  {tt("guides.eyebrowPlaybooks")}
                </Link>
              </p>
            </div>
            <h1 className="display mt-6 text-4xl leading-[0.98] text-charcoal md:text-6xl lg:text-7xl">
              {g.title}
            </h1>
            <div className="mt-10 flex items-center justify-between border-y border-gold/15 py-5 text-xs font-mono text-stone-grey">
              <span>{tt("common.article.masterPlaybook")}</span>
              <span>{tt("common.updatedOn", { date: formatDate(g.updated, locale) })}</span>
            </div>
          </Reveal>
        </header>

        {/* Complete Rectangle 16:9 Hero Banner — Edge-to-Edge Fill */}
        <div className="mx-auto mt-10 w-full max-w-4xl px-6">
          <Reveal>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-gold/25 shadow-xl shadow-gold/5">
              <Image
                src={heroIllustration}
                alt={g.title}
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
                path={`/guides/${slug}`}
                title={tt("common.translation.notAvailableTitle")}
                body={tt("common.translation.notAvailableBody", {
                  language: tt("common.language.label"),
                })}
                readInEnglish={tt("common.translation.readInEnglish")}
              />
            )}

            {/* Visual Storybook Renderer.
                `lang` marks the prose when the body is still English inside a
                Telugu or Hindi page: a screen reader switches voice instead of
                reading English words with Telugu phonetics, and the browser
                stops treating the page as wholly one language. */}
            <div lang={translated ? undefined : DEFAULT_LOCALE}>
            <VisualStoryRenderer
              strings={storyStrings}
              slug={g.slug}
              title={g.title}
              excerpt={g.intro}
              bodyMd={g.body}
              category="Buyer Playbook"
              locale={locale}
            />
            </div>

            {/* FAQ Section */}
            <section aria-label={tt("common.article.faqAria")} className="mt-20 border-t border-gold/15 pt-12">
              <h2 className="display text-3xl text-charcoal md:text-4xl">{tt("common.article.faqHeading")}</h2>
              <div className="mt-8">
                <Faq items={[...g.faqs]} />
              </div>
            </section>
          </Reveal>

          {/* Sticky Sidebar Rail */}
          <aside className="hidden md:block">
            <div className="sticky top-28 flex flex-col gap-8">
              {toc.length > 1 && (
                <nav aria-label={tt("common.article.playbookNav")} className="rounded-2xl border border-gold/20 bg-white/80 p-6 shadow-sm">
                  <p className="label text-gold-ink">{tt("common.article.playbookNav")}</p>
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
                <p className="label text-gold-ink">{tt("common.article.expertAssistance")}</p>
                <p className="display mt-3 text-2xl leading-snug">
                  Questions this playbook didn't answer?
                </p>
                <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                  Our Shankarpally advisory team walks through every land document in person.
                </p>
                <Link
                  href={localizePath("/contact", locale)}
                  className="btn-gold mt-6 inline-block w-full text-center !text-charcoal"
                >
                  Ask Our Team
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Lead Form Callout */}
        <section aria-label={tt("common.article.speakToTeam")} className="mx-auto mt-24 max-w-4xl px-6 md:px-10">
          <Reveal className="rounded-3xl border border-gold/25 bg-travertine p-8 shadow-lg md:p-12">
            <h2 className="display text-3xl text-charcoal md:text-4xl">
              Put this playbook to work
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-grey">
              Visit an approved, titled community and walk through every
              document this guide describes — in person, no obligation.
            </p>
            <div className="mt-10">
              <LeadForm strings={formStrings} intent="Guide follow-up" />
            </div>
          </Reveal>
        </section>
      </article>
    </>
  );
}
