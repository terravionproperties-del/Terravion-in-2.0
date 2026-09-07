import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import Faq from "@/components/ui/Faq";
import LeadForm from "@/components/forms/LeadForm";
import { leadFormStrings } from "@/lib/i18n/lead-form";
import { projects, getProject } from "@/lib/data/projects";
import { PROJECT_STILLS, stillUrl } from "@/lib/film";
import {
  projectSchema,
  faqSchema,
  breadcrumbSchema,
  jsonLd,
} from "@/lib/schema";
import { buildProjectMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";
import { mediaFor } from "@/lib/data/project-media";
import {
  ProjectGallery,
  ProjectFilm,
  ProjectPress,
  ProjectDocuments,
} from "@/components/projects/ProjectMedia";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const p = getProject(slug);
  if (!p) return {};

  // The project's own hero frame, so a shared link shows the land rather than
  // the generic site card.
  const still = PROJECT_STILLS[p.slug] ?? PROJECT_STILLS.sanctuary;

  return buildProjectMetadata({
    locale,
    slug: p.slug,
    name: p.name,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    keywords: p.keywords,
    heroImage: stillUrl(still.hero),
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}) {
  const { slug, locale } = await params;
  const formStrings = await leadFormStrings(locale);
  const p = getProject(slug);
  if (!p) notFound();

  const stills = PROJECT_STILLS[slug] ?? PROJECT_STILLS.sanctuary;
  const media = mediaFor(slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(projectSchema(p)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema([...p.faqs])) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Projects", path: "/projects" },
              { name: p.name, path: `/projects/${p.slug}` },
            ])
          ),
        }}
      />

      {/* Cinematic hero — the community's own frame from the reel, full bleed */}
      <section className="relative flex min-h-svh flex-col justify-end overflow-hidden text-charcoal">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${stillUrl(stills.hero)})` }}
        />
        {/* readability scrim, weighted to the lower band where the title sits */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(247,244,238,.97) 0%, rgba(247,244,238,.9) 28%, rgba(247,244,238,.52) 55%, rgba(247,244,238,.64) 100%)",
          }}
        />
        {/*
          Background is full bleed; the words are not. Every other section on
          this page sits in a max-w-6xl column, so a hero that starts its text
          at the viewport edge puts the headline ~570px left of the paragraph
          beneath it on a wide monitor. One column, or nothing aligns.
        */}
        <div className="shell relative pb-20 pt-44 md:pb-24">
          <Reveal>
            <p className="label" style={{ color: p.accent }}>
              {p.approval} · {p.location}
            </p>
            <h1 className="display mt-5 text-6xl md:text-[7.5rem] md:leading-[0.95]">
              {p.shortName}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">
              {p.headline}
            </p>
          </Reveal>
          <Reveal delay={0.15} className="mt-12 flex flex-wrap gap-x-12 gap-y-6">
            {p.highlights.map((h) => (
              <div key={h.label}>
                <p className="label text-text-muted">{h.label}</p>
                <p className="display mt-1 text-2xl md:text-3xl">{h.value}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Narrative */}
      <section className="bg-ivory py-20 md:py-28" aria-label={`About ${p.name}`}>
        <div className="shell grid gap-12 md:grid-cols-12">
          {/*
            The left rail is sticky rather than empty. A third of the row
            holding one 13-character label is the thing that reads as
            unfinished; a label that travels with the reader as they move down
            the narrative earns the space it occupies.
          */}
          <Reveal className="md:col-span-3">
            <div className="md:sticky md:top-32">
              <p className="label text-gold-ink">The community</p>
              <div className="mt-5 h-px w-12 bg-brass/40" />
              <p className="mt-5 text-sm leading-relaxed text-text-muted">
                {p.approval} · {p.acreage}
              </p>
            </div>
          </Reveal>
          <div className="space-y-8 md:col-span-9">
            <Reveal>
              <p className="display text-2xl leading-snug text-ink md:text-4xl">
                {p.intro}
              </p>
            </Reveal>
            {p.narrative.map((para, i) => (
              <Reveal key={i} delay={0.05 * i}>
                <p className="max-w-3xl text-base leading-relaxed text-text-secondary md:text-lg">
                  {para}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Masterplan strip */}
      <section className="bg-bone py-20 md:py-28" aria-label="Masterplan and layout">
        <div className="shell">
          <Reveal>
            <p className="label text-gold-ink">Masterplan</p>
            <h2 className="display mt-4 text-3xl text-ink md:text-5xl">
              Laid out for the long term.
            </h2>
          </Reveal>
          {/*
            The figures are the design, not contents of a card. A rounded box
            around three numbers is the shape of an admin panel; a rule and
            generous type is the shape of a prospectus. Tabular figures keep the
            three columns aligned to the same baseline grid.
          */}
          <Reveal className="mt-16 border-t border-ink/15">
            <dl className="grid gap-x-10 gap-y-12 md:grid-cols-3">
              {[
                { k: "Extent & plots", v: p.acreage, sub: p.plots },
                { k: "Plot sizes", v: p.plotSizes, sub: p.roads },
                { k: "From", v: p.priceFrom, sub: p.approval },
              ].map((stat) => (
                <div key={stat.k} className="border-b border-ink/10 pb-8 pt-10">
                  <dt className="label text-text-muted">{stat.k}</dt>
                  <dd className="display mt-4 text-4xl tabular-nums text-ink md:text-5xl">
                    {stat.v}
                  </dd>
                  <dd className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {stat.sub}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* ── Direct 3D Digital Twin Launcher ── */}
          {(p.slug === "sanctuary" || p.slug === "raghunath-county") && (
            <Reveal className="mt-12">
              <div className="rounded-3xl bg-gradient-to-r from-travertine via-white-lux to-travertine p-8 text-charcoal flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg border border-gold/30">
                <div>
                  <span className="rounded bg-gold/15 px-3 py-1 text-xs font-bold text-gold-ink border border-gold/40">
                    🧊 Interactive 3D & 2D GIS Platform
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl font-bold mt-3">
                    Explore {p.name} Master Plan in 3D
                  </h3>
                  <p className="text-sm text-text-secondary mt-2 max-w-xl">
                    Inspect all 202 plots, check live availability, filter by facing, road width, and budget before your site visit.
                  </p>
                </div>
                <Link
                  href={`/gis/${p.slug}`}
                  className="rounded-2xl bg-gradient-to-r from-[#c59b27] to-[#e5be58] text-charcoal font-black px-6 py-4 text-sm transition-all duration-300 hover:scale-105 shadow-xl flex items-center gap-2 flex-shrink-0 cursor-pointer"
                >
                  <span>Launch 3D Explorer</span>
                  <span>→</span>
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Amenities — the register sits on the community's own footage, so the
          section reads as another frame of the film rather than a dark slab */}
      <section
        className="relative overflow-hidden text-charcoal"
        aria-label="Amenities"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${stillUrl(stills.wide)})` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(247,244,238,.97) 0%, rgba(247,244,238,.94) 42%, rgba(247,244,238,.72) 72%, rgba(247,244,238,.55) 100%)",
          }}
        />
        <div className="shell relative py-20 md:py-28">
          <Reveal>
            <p className="label text-gold-ink">Amenities</p>
            <h2 className="display mt-4 max-w-xl text-3xl md:text-5xl">
              Built in before you move in.
            </h2>
          </Reveal>
          <Reveal
            stagger={0.04}
            className="mt-14 grid max-w-6xl gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {p.amenities.map((a) => (
              <p
                key={a}
                className="border-b border-charcoal/15 pb-4 text-base text-text-secondary"
              >
                {a}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Location & connectivity */}
      <section className="bg-ivory py-20 md:py-28" aria-label="Location and connectivity">
        <div className="shell">
          <Reveal>
            <p className="label text-gold-ink">Location</p>
            <h2 className="display mt-4 text-3xl text-ink md:text-5xl">
              Minutes that matter.
            </h2>
          </Reveal>
          {/*
            Two columns, not one full-width list. A single 1150px row puts the
            place name and its drive time roughly 700px apart with nothing
            between them — the eye loses the pairing and the section reads as
            mostly empty. Two columns halve the travel and double the density.
          */}
          <Reveal stagger={0.06} className="mt-14 grid gap-x-16 md:grid-cols-2">
            {p.distances.map((d) => (
              <div
                key={d.place}
                className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-4"
              >
                <p className="text-base text-text-primary">{d.place}</p>
                <p className="shrink-0 whitespace-nowrap text-sm tabular-nums text-text-muted">
                  <span className="display me-2 text-xl tabular-nums text-ink">
                    {d.driveTime}
                  </span>
                  {d.distanceKm} km
                </p>
              </div>
            ))}
          </Reveal>
          <Reveal className="mt-8">
            <Link href="/locations/shankarpally" className="label text-gold-ink underline-offset-8 hover:underline">
              Read the full Shankarpally location guide →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Investment potential */}
      <section className="bg-bone py-20 md:py-28" aria-label="Investment potential">
        <div className="shell grid gap-12 md:grid-cols-2">
          <Reveal>
            <p className="label text-gold-ink">Investment potential</p>
            <h2 className="display mt-4 text-3xl leading-tight text-ink md:text-5xl">
              The corridor does
              <br />
              the compounding.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="space-y-6 text-base leading-relaxed text-text-secondary md:text-lg">
            <p>
              {p.shortName === "Mansanpally"
                ? "Mansanpally sits in the airport-and-RRR quadrant of Hyderabad's growth — the southern mirror of what the western corridor was a decade ago. Early registrants receive the launch masterplan and pre-launch pricing first."
                : `${p.name} pairs statutory approval with position: the ORR within a short drive, the proposed Regional Ring Road on the horizon, IIT Hyderabad and the western IT corridor pulling employment — and housing demand — steadily westward.`}
            </p>
            <p>
              Land values are subject to market conditions and no appreciation
              is guaranteed — our case rests on infrastructure, approvals and
              scarcity, which you can verify yourself.{" "}
              <Link href="/investment" className="text-gold-ink underline underline-offset-4">
                Read the investment thesis
              </Link>{" "}
              or model scenarios with the{" "}
              <Link href="/tools/roi-calculator" className="text-gold-ink underline underline-offset-4">
                ROI calculator
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      {/* Downloads & floor plans */}
      <section className="bg-ivory py-20 md:py-28" aria-label="Downloads">
        <div className="shell">
          <Reveal className="rounded-3xl border border-ink/10 bg-white p-10 md:p-14">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div>
                <h2 className="display text-2xl text-ink md:text-3xl">
                  Brochure, masterplan & plot registry
                </h2>
                <p className="mt-3 max-w-xl text-base text-text-secondary">
                  We share current documents over WhatsApp so you always
                  receive the latest revision — availability changes weekly.
                </p>
              </div>
              <a
                href={`https://wa.me/919347259638?text=${encodeURIComponent(
                  `Hello Terravion — please send the ${p.name} brochure and masterplan.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="label rounded-full bg-brass px-8 py-4 text-white transition-colors hover:bg-gold hover:text-charcoal"
              >
                Get documents on WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Site media — gallery, progress film, news coverage and approval documents */}
      {media && (
        <section className="bg-ivory pb-4 pt-0" aria-label={`${p.name} gallery and documents`}>
          <div className="shell">
            <ProjectGallery images={media.gallery} />
            <ProjectFilm videos={media.video} />
            <ProjectPress articles={media.news} />
            <ProjectDocuments documents={media.documents} />
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="bg-ivory pb-24 md:pb-32" aria-label="Frequently asked questions">
        <div className="shell">
          <Reveal>
            <p className="label text-gold-ink">Questions, answered</p>
            <h2 className="display mt-4 text-3xl text-ink md:text-5xl">
              Before you ask.
            </h2>
          </Reveal>
          <Reveal className="mt-10">
            <Faq items={[...p.faqs]} />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-travertine py-24 text-charcoal md:py-36" aria-label={`Book a visit to ${p.name}`}>
        <div className="shell grid gap-14 md:grid-cols-2">
          <Reveal>
            <p className="label text-gold-ink">The next step</p>
            <h2 className="display mt-5 text-4xl leading-[1.05] md:text-6xl">
              Stand on
              <br />
              <em className="text-gold-ink">{p.shortName}.</em>
            </h2>
            <p className="mt-8 max-w-md text-base leading-relaxed text-text-secondary">
              {p.status === "ready"
                ? "Site visits run daily from the Shankarpally experience centre. Approval documents travel with us."
                : "Register interest and you'll receive the masterplan and pre-launch pricing before public release."}
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <LeadForm strings={formStrings}
              defaultProject={p.slug}
              intent={p.status === "ready" ? "Site visit" : "Launch registration"}
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
