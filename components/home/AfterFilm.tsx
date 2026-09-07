import Link from "next/link";
import BookingExperience from "./BookingExperience";
import { projects } from "@/lib/data/projects";
import { site } from "@/lib/site";

/**
 * What follows the film.
 *
 * Not a stack of white sections — the reel keeps going. Every panel below is
 * filled edge to edge with a still lifted from the same footage, so the page
 * never drops out of the film into a template. Stills are addressed by their
 * hd-tier index (original frame ÷ 2).
 */

/** original frame → hd tier still */
const still = (frame: number) =>
  `/film/hd/f${String(Math.round(frame / 2)).padStart(4, "0")}.webp`;

/**
 * Stills are chosen from the reel's CLEAN windows only — frames carrying the
 * film's own baked-in typography would put two competing headlines in one
 * panel (f1540, for instance, catches the Terravion logo mid-frame).
 */
const panels = [
  { slug: "raghunath-county", frame: 780 }, // its own gated entrance
  { slug: "sanctuary", frame: 1010 }, // the palm boulevard through the arch
  { slug: "mansanpally", frame: 1530 }, // the valley, still open
];

const indexColumns = [
  {
    heading: "Locations",
    links: [
      { label: "Shankarpally", href: "/locations/shankarpally" },
      { label: "Mokila", href: "/locations/mokila" },
      { label: "Kokapet", href: "/locations/kokapet" },
      { label: "Tellapur", href: "/locations/tellapur" },
      { label: "All 13 locations", href: "/locations" },
    ],
  },
  {
    heading: "Before you buy",
    links: [
      { label: "HMDA approval, explained", href: "/guides/hmda-guide" },
      { label: "Legal verification", href: "/guides/legal-verification" },
      { label: "Registration in Telangana", href: "/guides/registration-process" },
      { label: "The 25-point checklist", href: "/guides/investment-checklist" },
      { label: "All 12 guides", href: "/guides" },
    ],
  },
  {
    heading: "The journal",
    links: [
      { label: "Why invest in Shankarpally", href: "/blog/why-invest-in-shankarpally" },
      { label: "The ORR growth story", href: "/blog/orr-growth-story" },
      { label: "Plots vs apartments", href: "/blog/plots-vs-apartments" },
      { label: "The NRI's guide", href: "/blog/nri-guide-plot-investment" },
      { label: "All 72 essays", href: "/blog" },
    ],
  },
  {
    heading: "Tools",
    links: [
      { label: "EMI calculator", href: "/tools/emi-calculator" },
      { label: "ROI scenarios", href: "/tools/roi-calculator" },
      { label: "The investment thesis", href: "/investment" },
      { label: "Amenities", href: "/amenities" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export default function AfterFilm() {
  return (
    <>
      {/* ── THE COMMUNITIES · three full-height frames, no gutters ────── */}
      <section
        aria-label="The communities"
        className="grid grid-cols-1 md:grid-cols-3"
      >
        {panels.map(({ slug, frame }) => {
          const p = projects.find((x) => x.slug === slug)!;
          return (
            <Link
              key={slug}
              href={`/projects/${slug}`}
              className="group relative flex min-h-[78svh] flex-col justify-end overflow-hidden md:min-h-[100svh]"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                style={{ backgroundImage: `url(${still(frame)})` }}
              />
              {/* readability scrim, bottom-weighted so the image stays the subject */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(247,244,238,.97) 0%, rgba(247,244,238,.9) 26%, rgba(247,244,238,.45) 52%, transparent 74%)",
                }}
              />
              <div className="relative p-8 pb-12 md:p-10 md:pb-14">
                <p className="label text-gold-ink">{p.approval}</p>
                <h3 className="display mt-4 text-[clamp(2rem,3.4vw,3.2rem)] leading-[1.02] text-charcoal">
                  {p.shortName}
                </h3>
                <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-text-secondary">
                  {p.headline}
                </p>
                <div className="mt-7 flex items-center gap-4">
                  <span className="label text-charcoal">
                    {p.status === "ready" ? "Explore" : "Register interest"}
                  </span>
                  <span className="h-px w-10 bg-gold transition-all duration-500 group-hover:w-16" />
                </div>
                <dl className="mt-8 flex gap-8 border-t border-charcoal/15 pt-6">
                  {p.highlights.slice(0, 2).map((h) => (
                    <div key={h.label}>
                      <dt className="label text-text-muted">{h.label}</dt>
                      <dd className="mt-1 text-base text-charcoal">{h.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Link>
          );
        })}
      </section>

      {/* ── THE INVITATION · one frame, one floating card ─────────────── */}
      <BookingExperience />

      {/* ── THE INDEX · dense, light, no dead space ─────────────────── */}
      <section
        aria-label="Explore Terravion"
        className="bg-ivory py-20 md:py-24"
      >
        <div className="shell grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {indexColumns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="label mb-6 text-gold-ink">{col.heading}</p>
              <ul className="flex flex-col gap-3.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-text-secondary transition-colors hover:text-charcoal"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mx-auto mt-16 flex max-w-[1400px] flex-wrap items-center justify-between gap-6 border-t border-charcoal/10 pt-10">
          <p className="max-w-[52ch] text-sm leading-relaxed text-text-secondary">
            HMDA & DTCP approved villa plot communities in Shankarpally, West
            Hyderabad. Approvals and title documents are open for independent
            verification before purchase.
          </p>
          <a
            href={site.phoneHref}
            className="display text-2xl text-charcoal transition-colors hover:text-gold-ink md:text-3xl"
          >
            {site.phone}
          </a>
        </div>
      </section>
    </>
  );
}
