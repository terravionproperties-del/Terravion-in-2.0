import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { EmiCalculator } from "@/components/tools/Calculators";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { localizePath, type Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";

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
    title: t("metadata.emiCalculator.title"),
    description: t("metadata.emiCalculator.description"),
    path: "/tools/emi-calculator",
    locale,
  });
}

export default async function EmiCalculatorPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, ["tools", "navigation", "metadata"]);

  // The widget is a client component, so its copy is resolved here on the
  // server and handed over as props. Nothing about the dictionary reaches the
  // browser — only the finished strings for this one page do.
  const strings = {
    loanAmount: t("tools.emi.loanAmount"),
    interestRate: t("tools.emi.interestRate"),
    tenure: t("tools.emi.tenure"),
    monthlyEmi: t("tools.emi.monthlyEmi"),
    totalInterest: t("tools.emi.totalInterest"),
    totalPayable: t("tools.emi.totalPayable"),
    disclaimer: t("tools.emi.disclaimer"),
    years: t("tools.years"),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("navigation.investment"), path: "/investment" },
              { name: t("metadata.emiCalculator.title"), path: "/tools/emi-calculator" },
            ])
          ),
        }}
      />
      <section className="bg-ivory pb-24 pt-40 md:pb-32 md:pt-52">
        <div className="shell">
          <Reveal>
            <p className="label text-gold-ink">{t("tools.eyebrow")}</p>
            <h1 className="display mt-5 max-w-3xl text-5xl leading-[1.02] text-ink md:text-7xl">
              {t("tools.emi.headlineLead")}{" "}
              <em className="text-gold-ink">{t("tools.emi.headlineEmphasis")}</em>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">
              {t("tools.emi.introBefore")}{" "}
              <Link
                href={localizePath("/guides/loan-process", locale)}
                className="text-gold-ink underline underline-offset-4"
              >
                {t("tools.emi.introLink")}
              </Link>{" "}
              {t("tools.emi.introAfter")}
            </p>
          </Reveal>
          <Reveal className="mt-14">
            <EmiCalculator locale={locale} strings={strings} />
          </Reveal>
          <Reveal className="mt-10 flex flex-wrap gap-6">
            <Link
              href={localizePath("/tools/roi-calculator", locale)}
              className="label text-gold-ink underline-offset-8 hover:underline"
            >
              {t("tools.tryRoi")}
            </Link>
            <Link
              href={localizePath("/site-visit", locale)}
              className="label text-text-secondary underline-offset-8 hover:underline"
            >
              {t("tools.bookSiteVisit")}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
