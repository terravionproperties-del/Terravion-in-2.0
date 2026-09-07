import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import Faq from "@/components/ui/Faq";
import LeadForm from "@/components/forms/LeadForm";
import { leadFormStrings } from "@/lib/i18n/lead-form";
import { breadcrumbSchema, faqSchema, jsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { localizePath, type Locale } from "@/lib/i18n/config";
import { getTranslator, type Translator } from "@/lib/i18n/dictionaries";

/**
 * The investment thesis, fully dictionary-driven.
 *
 * Every string on this page used to be a JSX literal, which is exactly why
 * switching to Telugu changed the navigation and nothing else. The copy now
 * lives in `locales/<lang>/investment.json`; this file only decides where it
 * goes.
 *
 * The FAQ array is built from the dictionary too, which matters more than it
 * looks: the same array feeds `faqSchema()`, so the structured data Google reads
 * is in the same language as the page it describes. Building the JSON-LD from a
 * separate English constant was the quieter half of the same bug.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslator(locale, ["metadata"]);

  return buildPageMetadata({
    title: t("metadata.investment.title"),
    description: t("metadata.investment.description"),
    path: "/investment",
    locale,
  });
}

/** The five FAQs, in the reader's language, for both the page and the schema. */
function faqsFor(t: Translator) {
  return (["one", "two", "three", "four", "five"] as const).map((k) => ({
    q: t(`investment.faqs.${k}.q`),
    a: t(`investment.faqs.${k}.a`),
  }));
}

export default async function InvestmentPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const [t, formStrings] = await Promise.all([
    getTranslator(locale, ["investment", "navigation", "buttons"]),
    leadFormStrings(locale),
  ]);

  const faqs = faqsFor(t);
  const L = (path: string) => localizePath(path, locale);

  const parts = [
    {
      key: "one",
      links: [
        {
          href: "/blog/financial-district-spillover",
          label: t("investment.thesis.parts.one.linkLabel"),
        },
      ],
    },
    {
      key: "two",
      links: [
        { href: "/blog/rrr-hyderabad-impact", label: t("investment.thesis.parts.two.linkLabel") },
      ],
    },
    { key: "three", links: [] as { href: string; label: string }[] },
    {
      key: "four",
      links: [
        { href: "/guides/legal-verification", label: t("investment.thesis.parts.four.linkLabel") },
        {
          href: "/guides/investment-checklist",
          label: t("investment.thesis.parts.four.linkLabelSecond"),
        },
      ],
    },
  ] as const;

  const tools = [
    { key: "emi", href: "/tools/emi-calculator" },
    { key: "roi", href: "/tools/roi-calculator" },
    { key: "checklist", href: "/guides/investment-checklist" },
  ] as const;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema(faqs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema(
              [
                { name: t("navigation.home"), path: "/" },
                { name: t("investment.title"), path: "/investment" },
              ],
              locale
            )
          ),
        }}
      />
      <section className="bg-ivory pb-24 pt-40 md:pb-32 md:pt-52">
        <div className="shell">
          <Reveal>
            <p className="label text-gold-ink">{t("investment.eyebrow")}</p>
            <h1 className="display mt-5 max-w-4xl text-5xl leading-[1.02] text-ink md:text-7xl">
              {t("investment.headline.lead")}
              <em className="text-gold-ink"> {t("investment.headline.emphasis")}</em>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">
              {t("investment.intro")}
            </p>
          </Reveal>

          <div className="mt-20 space-y-16">
            {parts.map((part) => (
              <Reveal key={part.key} className="grid gap-8 md:grid-cols-[16rem_1fr]">
                <p className="display text-5xl text-[#8A6736]">
                  {t(`investment.thesis.parts.${part.key}.numeral`)}
                </p>
                <div>
                  <h2 className="display text-3xl text-ink md:text-4xl">
                    {t(`investment.thesis.parts.${part.key}.title`)}
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
                    {t(`investment.thesis.parts.${part.key}.body`)}{" "}
                    {part.links.map((link, i) => (
                      <span key={link.href}>
                        {i > 0 && ` ${t("investment.thesis.parts.four.conjunction")} `}
                        <Link href={L(link.href)} className="text-gold-ink underline underline-offset-4">
                          {link.label}
                        </Link>
                      </span>
                    ))}
                    {part.links.length > 0 && "."}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Tools */}
          <Reveal className="mt-24 grid gap-6 md:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={L(tool.href)}
                className="group rounded-2xl border border-ink/10 bg-white p-8 transition-all duration-500 hover:-translate-y-1 hover:border-brass/40"
              >
                <h3 className="display text-2xl text-ink group-hover:text-gold-ink">
                  {t(`investment.tools.${tool.key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {t(`investment.tools.${tool.key}.body`)}
                </p>
              </Link>
            ))}
          </Reveal>

          <Reveal className="mt-24">
            <h2 className="display text-3xl text-ink md:text-4xl">{t("investment.faqHeading")}</h2>
            <div className="mt-8">
              <Faq items={faqs} />
            </div>
          </Reveal>

          <Reveal className="mt-24 rounded-3xl border border-gold/25 bg-travertine p-8 text-charcoal md:p-14">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="display text-3xl md:text-4xl">
                  {t("investment.cta.titleLead")}{" "}
                  <em className="text-gold-ink">{t("investment.cta.titleEmphasis")}</em>
                </h2>
                <p className="mt-5 max-w-md text-base leading-relaxed text-text-secondary">
                  {t("investment.cta.body")}
                </p>
              </div>
              <LeadForm strings={formStrings} intent={t("investment.cta.intent")} />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
