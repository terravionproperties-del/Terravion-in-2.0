import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import Faq from "@/components/ui/Faq";
import LeadForm from "@/components/forms/LeadForm";
import { leadFormStrings } from "@/lib/i18n/lead-form";
import { locations, getBySlug } from "@/content/locations";
import { renderMarkdown, extractToc } from "@/lib/markdown";
import { faqSchema, breadcrumbSchema, jsonLd } from "@/lib/schema";
import { buildLocationMetadata } from "@/lib/seo";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";
import {
  availableLocalesFor,
  resolveContent,
} from "@/lib/content/translated";
import TranslationNotice from "@/components/i18n/TranslationNotice";
import { absoluteUrl } from "@/lib/site";

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
  return locations.map((l) => ({ slug: l.slug }));
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
  const { content: l, translated } = await resolveContent("locations", src, locale);

  return buildLocationMetadata({
    locale,
    availableLocales: availableLocalesFor("locations", slug),
    // The page renders in-locale even when the prose is still English. When it
    // is, the English URL is the canonical one — otherwise two URLs would offer
    // Google the same body text.
    canonicalLocale: translated ? locale : DEFAULT_LOCALE,
    slug: l.slug,
    name: l.name,
    metaTitle: l.metaTitle,
    metaDescription: l.metaDescription,
    keywords: l.keywords,
  });
}

export default async function LocationPage({
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
  // An untranslated body no longer dead-ends. See the note in
  // `app/[locale]/guides/[slug]/page.tsx` — the stub that used to live here
  // gave the reader a "coming soon" page with no note on it, and the listing
  // routed around it by linking at the English URL, which threw them out of
  // their language. The page now always renders, with the English prose marked
  // `lang="en"` beneath a notice.

  const { content: l, translated } = await resolveContent("locations", source, locale);
  const tt = await getTranslator(locale, ["common"]);

  const html = renderMarkdown(l.body, locale);
  const toc = extractToc(l.body);

  const placeSchema = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${l.name}, Hyderabad`,
    description: l.metaDescription,
    url: absoluteUrl(`/locations/${l.slug}`),
    containedInPlace: { "@type": "City", name: "Hyderabad" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(placeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema([...l.faqs])) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Locations", path: "/locations" },
              { name: l.name, path: `/locations/${l.slug}` },
            ])
          ),
        }}
      />

      <article className="bg-ivory pb-24 pt-40 md:pb-32 md:pt-52">
        <header className="mx-auto max-w-4xl px-6 md:px-10">
          <Reveal>
            <p className="label text-gold-ink">
              <Link href={localizePath("/locations", locale)} className="hover:underline">
                Locations
              </Link>{" "}
              · West Hyderabad
            </p>
            <h1 className="display mt-6 text-5xl leading-[1.02] text-ink md:text-7xl">
              {l.name}
            </h1>
            <p className="display mt-5 text-xl text-gold-ink md:text-2xl">{l.epithet}</p>
            <p className="article-intro mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">
              {l.intro}
            </p>
            {l.distanceFromShankarpallyKm > 0 && (
              <p className="label mt-8 text-text-muted">
                {l.distanceFromShankarpallyKm} km from Shankarpally ·{" "}
                {l.driveTimeFromShankarpally} by road
              </p>
            )}
          </Reveal>
        </header>

        <div className="mx-auto mt-16 grid max-w-6xl gap-14 px-6 md:grid-cols-[1fr_16rem] md:px-10">
          <Reveal className="min-w-0">
            {!translated && (
              <TranslationNotice
                locale={locale}
                path={`/locations/${slug}`}
                title={tt("common.translation.notAvailableTitle")}
                body={tt("common.translation.notAvailableBody", {
                  language: tt("common.language.label"),
                })}
                readInEnglish={tt("common.translation.readInEnglish")}
              />
            )}
            {/* `lang` marks the prose when the note is still English inside a
                Telugu or Hindi page: a screen reader switches voice instead of
                reading English words with Telugu phonetics, and the browser
                stops treating the page as wholly one language. */}
            <div
              lang={translated ? undefined : DEFAULT_LOCALE}
              className="article-prose max-w-3xl"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <section aria-label={tt("common.article.faqAria")} className="mt-16 max-w-3xl">
              <h2 className="display text-2xl text-ink md:text-3xl">{tt("common.article.faqHeading")}</h2>
              <div className="mt-6">
                <Faq items={[...l.faqs]} />
              </div>
            </section>
          </Reveal>

          <aside className="hidden md:block">
            <div className="sticky top-28 flex flex-col gap-10">
              {toc.length > 1 && (
                <nav aria-label={tt("common.article.onThisPage")}>
                  <p className="label text-text-muted">{tt("common.article.onThisPage")}</p>
                  <ul className="mt-4 space-y-2.5 border-s border-ink/10 ps-4">
                    {toc.map((t, i) => (
                      // Index-suffixed: the id is the HTML anchor and must
                      // mirror the heading exactly, so two identically-worded
                      // headings share one. The React key must still be unique.
                      <li key={`${t.id}-${i}`}>
                        <a
                          href={`#${t.id}`}
                          className="block text-sm leading-snug text-text-secondary transition-colors hover:text-gold-ink"
                        >
                          {t.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <div className="rounded-2xl border border-gold/25 bg-travertine p-7 text-charcoal">
                <p className="display text-xl leading-snug">
                  Considering plots near {l.name}?
                </p>
                <Link
                  href={localizePath("/site-visit", locale)}
                  className="label mt-5 inline-block rounded-full bg-brass px-6 py-3 text-white transition-colors hover:bg-gold hover:text-charcoal"
                >
                  Book a site visit
                </Link>
              </div>
            </div>
          </aside>
        </div>

        <section aria-label={tt("common.article.enquireAria")} className="mx-auto mt-24 max-w-4xl px-6 md:px-10">
          <Reveal className="rounded-3xl border border-ink/10 bg-bone p-8 md:p-12">
            <h2 className="display text-2xl text-ink md:text-3xl">
              Compare {l.name} with Shankarpally, on the ground
            </h2>
            <p className="mt-3 max-w-xl text-base text-text-secondary">
              One drive covers both. We'll show you the corridors, the
              approvals and the price logic — you draw your own conclusions.
            </p>
            <div className="mt-8">
              <LeadForm strings={formStrings} intent={`Location enquiry — ${l.name}`} />
            </div>
          </Reveal>
        </section>
      </article>
    </>
  );
}
