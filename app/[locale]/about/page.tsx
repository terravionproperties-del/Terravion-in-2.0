import type { Metadata } from "next";
import Chapters, { type Chapter } from "@/components/story/Chapters";
import ExecutiveCards from "@/components/ui/ExecutiveCards";
import { stillUrl } from "@/lib/film";
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
    title: t("metadata.about.title"),
    description: t("metadata.about.description"),
    path: "/about",
    locale,
  });
}

const chapters: Chapter[] = [
  {
    n: "01",
    kicker: "Why Terravion exists",
    title: "We started because the paperwork kept failing people.",
    body: [
      "Most plotted ventures around Hyderabad sell first and approve later. Buyers find out which one they bought when they try to build, or when they try to sell.",
      "We inverted the order. Approval, then infrastructure, then the first conversation with a buyer. It is slower. It costs more up front. It is the only version of this business we were willing to run.",
    ],
    frame: 1934,
    side: "left",
  },
  {
    n: "02",
    kicker: "Land philosophy",
    title: "We buy where the infrastructure is coming, not where it has arrived.",
    body: [
      "Once a road opens, the land beside it is already priced. The margin lives in the years before — which means reading alignments, employment corridors and school catchments rather than listings.",
      "That reading brought us west, to Shankarpally. A railway station, the Outer Ring Road within reach, IIT Hyderabad up the road at Kandi, and farmland still being farmed.",
    ],
    frame: 536,
    side: "right",
    plaque: { label: "Under development", value: "64 acres" },
  },
  {
    n: "03",
    kicker: "Approvals",
    title: "Sanctioned before a single plot is offered.",
    body: [
      "Sanctuary holds HMDA approval. Raghunath County holds DTCP approval. Both were sanctioned before either was marketed.",
      "Bring your own advocate. Run your own encumbrance search. We will hand over the link documents and wait — a title that cannot survive scrutiny is not worth selling.",
    ],
    frame: 780,
    side: "left",
    plaque: { label: "Sanctions held", value: "HMDA · DTCP" },
  },
  {
    n: "04",
    kicker: "Infrastructure",
    title: "The roads go in before the buyers do.",
    body: [
      "Forty-foot and thirty-three-foot cement concrete roads. Water, electricity and drainage underground, run to every boundary. Avenue plantation, footpaths, streetlights, a compound wall.",
      "A layout that promises this later is asking you to fund it. We would rather you walk it, in the evening, with the lights already on.",
    ],
    frame: 1290,
    side: "right",
  },
  {
    n: "05",
    kicker: "What comes next",
    title: "South, toward the airport.",
    body: [
      "Mansanpally sits in the quadrant that planners expect to move next — near the airport, between the Srisailam highway and the proposed Regional Ring Road.",
      "We will publish its extent, its masterplan and its approvals when they are in hand, and not a day earlier. Registered buyers see them first.",
    ],
    frame: 1530,
    side: "left",
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
            ])
          ),
        }}
      />

      {/* Opening title card — one line, held on one frame */}
      <section
        aria-label="About Terravion"
        className="relative isolate flex min-h-[100svh] items-end overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${stillUrl(1010)})` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to top, rgba(247,244,238,.97) 0%, rgba(247,244,238,.88) 30%, rgba(247,244,238,.5) 62%, rgba(247,244,238,.66) 100%)",
          }}
        />
        <div className="shell pb-24 md:pb-28">
          <p className="label text-gold-ink">Terravion Properties</p>
          <h1 className="display mt-6 max-w-[18ch] text-[clamp(2.6rem,6vw,5.6rem)] leading-[0.98] text-charcoal">
            Land is the one thing nobody can manufacture.
          </h1>
          <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-text-secondary">
            Five chapters on how we choose it, what we sanction before we sell,
            and what we build before you arrive.
          </p>
        </div>
      </section>

      <Chapters chapters={chapters} />

      {/* ── Executive Leadership Desk ── */}
      <section className="bg-ivory py-24 md:py-32 border-t border-ink/10" aria-label="Executive Leadership">
        <div className="shell">
          <ExecutiveCards
            title="Leadership & Client Advisory Desk"
            subtitle="Connect directly with our leadership team for verified title link documents, investment strategy briefings, and dedicated on-site tours."
          />
        </div>
      </section>
    </>
  );
}
