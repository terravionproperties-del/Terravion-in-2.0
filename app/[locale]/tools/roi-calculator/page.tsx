import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { RoiCalculator } from "@/components/tools/Calculators";
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
    title: t("metadata.roiCalculator.title"),
    description: t("metadata.roiCalculator.description"),
    path: "/tools/roi-calculator",
    locale,
  });
}

export default async function RoiCalculatorPage({
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
    purchaseValue: t("tools.roi.purchaseValue"),
    holdingPeriod: t("tools.roi.holdingPeriod"),
    cagr: t("tools.roi.cagr"),
    projectedValue: t("tools.roi.projectedValue"),
    projectedGain: t("tools.roi.projectedGain"),
    multiple: t("tools.roi.multiple"),
    disclaimerBefore: t("tools.roi.disclaimerBefore"),
    disclaimerStrong: t("tools.roi.disclaimerStrong"),
    disclaimerAfter: t("tools.roi.disclaimerAfter"),
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
              { name: t("metadata.roiCalculator.title"), path: "/tools/roi-calculator" },
            ])
          ),
        }}
      />
      <section className="bg-ivory pb-24 pt-40 md:pb-32 md:pt-52">
        <div className="shell">
          <Reveal>
            <p className="label text-gold-ink">{t("tools.eyebrow")}</p>
            <h1 className="display mt-5 max-w-3xl text-5xl leading-[1.02] text-ink md:text-7xl">
              {t("tools.roi.headlineLead")}{" "}
              <em className="text-gold-ink">{t("tools.roi.headlineEmphasis")}</em>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">
              {t("tools.roi.introBefore")}{" "}
              <Link
                href={localizePath("/investment", locale)}
                className="text-gold-ink underline underline-offset-4"
              >
                {t("tools.roi.introLink")}
              </Link>
              {t("tools.roi.introAfter")}
            </p>
          </Reveal>
          <Reveal className="mt-14">
            <RoiCalculator locale={locale} strings={strings} />
          </Reveal>
          <Reveal className="mt-10 flex flex-wrap gap-6">
            <Link
              href={localizePath("/tools/emi-calculator", locale)}
              className="label text-gold-ink underline-offset-8 hover:underline"
            >
              {t("tools.tryEmi")}
            </Link>
            <Link
              href={localizePath("/guides/investment-checklist", locale)}
              className="label text-text-secondary underline-offset-8 hover:underline"
            >
              {t("tools.checklist")}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
