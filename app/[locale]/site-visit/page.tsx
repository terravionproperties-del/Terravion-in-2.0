import type { Metadata } from "next";
import BookingExperience from "@/components/home/BookingExperience";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";
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
    title: t("metadata.siteVisit.title"),
    description: t("metadata.siteVisit.description"),
    path: "/site-visit",
    locale,
  });
}

const steps = [
  {
    n: "01",
    title: "The experience centre",
    body: "Masterplans, approval files and the plot registry, laid out on the table. Thirty minutes, all questions welcome.",
  },
  {
    n: "02",
    title: "The drive west",
    body: "We drive your likely commute — ORR, schools, the daily-life map — so the geography argues for itself.",
  },
  {
    n: "03",
    title: "The land",
    body: "Plot corners, roads, the clubhouse. Late afternoon is best; the light does the talking.",
  },
];

export default function SiteVisitPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Book a Site Visit", path: "/site-visit" },
            ])
          ),
        }}
      />
      <BookingExperience
        aside={
          <>
            <p className="label text-gold-ink font-semibold tracking-[0.2em] text-xs uppercase">Book a site visit</p>
            <h1 className="display mt-6 text-[clamp(2.4rem,4.2vw,4.2rem)] font-bold tracking-tight leading-[1.12] text-charcoal">
              Two hours that
              <br />
              settle everything.
            </h1>
            <div className="mt-12 flex flex-col gap-7">
              {steps.map((s) => (
                <div key={s.n} className="flex gap-6">
                  <p className="display text-2xl font-bold text-gold-ink/70">{s.n}</p>
                  <div>
                    <h2 className="display text-xl font-bold tracking-tight text-charcoal">{s.title}</h2>
                    <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-text-secondary">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <ul className="mt-10 space-y-2.5 border-t border-charcoal/15 pt-8 text-sm text-text-muted">
              <li>— Free pick-up from the ORR for outstation & NRI visitors</li>
              <li>— Weekdays are quieter; weekends fill first</li>
              <li>— Bring your own advisor or lawyer, gladly</li>
            </ul>
          </>
        }
      />
    </>
  );
}
