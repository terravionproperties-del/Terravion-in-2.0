import type { Metadata } from "next";
import Chapters, { type Chapter } from "@/components/story/Chapters";
import { stillUrl } from "@/lib/film";
import { site } from "@/lib/site";
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
    title: t("metadata.founder.title"),
    description: t("metadata.founder.description"),
    path: "/founder",
    locale,
  });
}

/**
 * No invented biography. The founder's name, portrait and history are business
 * facts we do not have — so this page says what the business demonstrably does
 * instead of inventing a person. Replace the closing card and add a signature
 * once the business supplies them.
 */
const rules: Chapter[] = [
  {
    n: "01",
    kicker: "The first rule",
    title: "Nothing is sold before it is sanctioned.",
    body: [
      "The ordinary sequence in this market is to announce, collect, and then chase approval. It works until it doesn't, and when it doesn't, the buyer carries it.",
      "We hold the sanction first. Sanctuary under HMDA, Raghunath County under DTCP. If a layout of ours is not approved, it is not for sale — no soft launch, no expression of interest, no pre-booking.",
    ],
    frame: 780,
    side: "left",
  },
  {
    n: "02",
    kicker: "The second rule",
    title: "The infrastructure goes in first, at our cost.",
    body: [
      "Roads, drainage, water, power, streetlights, the compound wall. All of it before handover, none of it billed later as a development charge.",
      "This is the expensive rule. It is also the one that decides whether a community exists in five years or is still a grid of survey stones.",
    ],
    frame: 1290,
    side: "right",
  },
  {
    n: "03",
    kicker: "The third rule",
    title: "Buy ahead of the road, never after it.",
    body: [
      "Land beside a finished highway is priced for the highway. The only honest way to offer value is to be there before the alignment is built — which means reading infrastructure, not listings.",
      "It also means being wrong sometimes, and being patient when we are early. We would rather hold land for a decade than sell a corridor we do not believe in.",
    ],
    frame: 536,
    side: "left",
  },
  {
    n: "04",
    kicker: "The fourth rule",
    title: "Hand over the file before you ask for it.",
    body: [
      "Approval letters, the layout sanction, the link documents, the encumbrance position. Given at the first meeting, not after a deposit.",
      "Bring your own advocate. Take the papers away. A title that needs our salesmanship to survive is a title we should not be selling.",
    ],
    frame: 1934,
    side: "right",
  },
];

export default function FounderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Founder", path: "/founder" },
            ])
          ),
        }}
      />

      <section
        aria-label="The founder"
        className="relative isolate flex min-h-[100svh] items-end overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${stillUrl(1978)})` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to top, rgba(247,244,238,.97) 0%, rgba(247,244,238,.88) 32%, rgba(247,244,238,.5) 66%, rgba(247,244,238,.64) 100%)",
          }}
        />
        <div className="shell pb-24 md:pb-28">
          <p className="label text-gold-ink">The founder</p>
          <h1 className="display mt-6 max-w-[20ch] text-[clamp(2.4rem,5.4vw,5rem)] leading-[0.98] text-charcoal">
            A patience business, run on four rules.
          </h1>
          <p className="mt-8 max-w-[48ch] text-lg leading-relaxed text-text-secondary">
            Terravion began with a frustration anyone who has bought land around
            Hyderabad will recognise: ventures announced before approval,
            layouts sold before roads, titles that take longer to verify than
            the plots take to sell out.
          </p>
        </div>
      </section>

      <Chapters chapters={rules} />

      {/* Attribution stays honest until the business supplies the real thing */}
      <section
        aria-label="Speak to the office"
        className="bg-travertine py-20 text-charcoal"
      >
        <div className="shell flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="display text-2xl">The Terravion family</p>
            <p className="label mt-3 text-text-muted">
              Founder biography, portrait and signature to be supplied by the
              business
            </p>
          </div>
          <a
            href={site.phoneHref}
            className="display text-2xl transition-colors hover:text-gold-ink md:text-3xl"
          >
            {site.phone}
          </a>
        </div>
      </section>
    </>
  );
}
