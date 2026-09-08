"use client";

import Link from "next/link";
import LuxuryButton from "@/components/ui/LuxuryButton";
import { usePointerLight } from "@/components/ui/usePointerLight";
import { stillUrl } from "@/lib/film";
import { site } from "@/lib/site";
import { usePathname } from "next/navigation";
import { localizePath, stripLocale, type Locale } from "@/lib/i18n/config";

/**
 * How every page ends.
 *
 * Not a footer of link columns — the last thing a visitor sees is the
 * experience centre at golden hour and an invitation to come and stand on the
 * land. The legal strip underneath is deliberately small: it is required, not
 * featured.
 */
export interface EndingStrings {
  ariaLabel: string;
  eyebrow: string;
  titleLines: string[];
  body: string;
  hours: string;
  bookVisit: string;
  whatsapp: string;
  call: string;
  legalLabel: string;
  disclaimer: string;
  nav: {
    projects: string;
    guides: string;
    journal: string;
    contact: string;
    privacy: string;
    terms: string;
  };
  rights: string;
}

export default function CinematicEnding({
  locale,
  strings,
}: {
  locale: Locale;
  strings: EndingStrings;
}) {
  const pathname = usePathname();
  const canonicalPath = stripLocale(pathname).path;
  const light = usePointerLight<HTMLDivElement>();
  const year = new Date().getFullYear();

  if (canonicalPath.startsWith("/gis/")) {
    return null;
  }

  return (
    <>
      <section
        aria-label={strings.ariaLabel}
        className="relative isolate flex min-h-[92svh] items-end overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${stillUrl(1876)})` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to top, rgba(247,244,238,.97) 0%, rgba(247,244,238,.88) 34%, rgba(247,244,238,.45) 68%, rgba(247,244,238,.62) 100%)",
          }}
        />

        <div className="mx-auto w-full max-w-[1500px] px-7 pb-20 md:px-12 md:pb-24">
          <div className="flex flex-col justify-between gap-14 lg:flex-row lg:items-end">
            <div className="max-w-2xl lg:max-w-3xl">
              <p className="label text-gold-ink font-semibold tracking-[0.2em] text-xs uppercase">{strings.eyebrow}</p>
              <h2 className="display mt-4 text-[clamp(2.3rem,4.4vw,4rem)] font-bold leading-[1.12] tracking-[-0.03em] text-charcoal">
                {strings.titleLines[0]}
                <br className="hidden sm:inline" />{" "}
                {strings.titleLines[1]}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-text-secondary">
                {strings.body}
              </p>
            </div>

            {/* the three ways in, floating on glass */}
            <div
              ref={light.ref}
              onPointerMove={light.onPointerMove}
              onPointerLeave={light.onPointerLeave}
              className="glass-card w-full max-w-[420px] rounded-2xl bg-white/95 p-7 shadow-2xl backdrop-blur-xl border border-charcoal/10 md:p-8"
            >
              <p className="label text-text-muted text-xs tracking-wider uppercase font-semibold">{strings.hours}</p>
              <div className="mt-6 flex flex-col gap-3.5">
                <LuxuryButton
                  href={localizePath("/site-visit", locale)}
                  variant="gold"
                  className="w-full text-xs font-bold tracking-wider py-3.5"
                >
                  {strings.bookVisit}
                </LuxuryButton>
                <div className="grid grid-cols-2 gap-3.5">
                  <LuxuryButton
                    href={site.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="!px-4 text-xs font-semibold tracking-wide"
                  >
                    {strings.whatsapp}
                  </LuxuryButton>
                  <LuxuryButton href={site.phoneHref} className="!px-4 text-xs font-semibold tracking-wide">
                    {strings.call}
                  </LuxuryButton>
                </div>
              </div>
              <a
                href={site.phoneHref}
                className="mt-6 block text-center text-2xl font-bold tracking-tight text-charcoal transition-colors hover:text-gold-ink"
              >
                {site.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* the required minimum, and nothing more */}
      <footer className="border-t border-charcoal/10 bg-travertine px-7 py-8 text-text-secondary md:px-12">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 text-xs md:flex-row md:items-center md:justify-between">
          <p>{strings.rights.replace("{year}", String(year))}</p>
          <nav aria-label={strings.legalLabel} className="flex flex-wrap gap-x-7 gap-y-2">
            <Link
              prefetch={false}
              href={localizePath("/projects", locale)}
              className="transition-colors hover:text-charcoal"
            >
              {strings.nav.projects}
            </Link>
            <Link
              prefetch={false}
              href={localizePath("/guides", locale)}
              className="transition-colors hover:text-charcoal"
            >
              {strings.nav.guides}
            </Link>
            <Link
              prefetch={false}
              href={localizePath("/blog", locale)}
              className="transition-colors hover:text-charcoal"
            >
              {strings.nav.journal}
            </Link>
            <Link
              prefetch={false}
              href={localizePath("/contact", locale)}
              className="transition-colors hover:text-charcoal"
            >
              {strings.nav.contact}
            </Link>
            <Link
              prefetch={false}
              href={localizePath("/privacy-policy", locale)}
              className="transition-colors hover:text-charcoal"
            >
              {strings.nav.privacy}
            </Link>
            <Link
              prefetch={false}
              href={localizePath("/terms", locale)}
              className="transition-colors hover:text-charcoal"
            >
              {strings.nav.terms}
            </Link>
          </nav>
          <p className="max-w-[46ch] leading-relaxed">{strings.disclaimer}</p>
        </div>
      </footer>
    </>
  );
}
