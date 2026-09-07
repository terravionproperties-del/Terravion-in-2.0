import Image from "next/image";
import Link from "next/link";
import { PROJECT_STILLS, stillUrl } from "@/lib/film";
import type { Project } from "@/lib/types";
import { localizePath, type Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";

/**
 * A project card, built as a brochure plate rather than a list row.
 *
 * The previous version was type on a brown gradient with no photograph in it
 * at all. For a business selling land, a card with no land on it is the one
 * thing that cannot work — the image is the product and everything else is
 * caption. So the photograph takes the full plate and the type sits in the
 * lower third, where the gradient guarantees contrast.
 *
 * Every text colour here is explicit. Nothing relies on opacity to be legible,
 * which is what made the old overlays unreadable as the frame behind changed.
 */
export default async function ProjectCard({
  project: p,
  locale,
  priority = false,
}: {
  project: Project;
  locale: Locale;
  priority?: boolean;
}) {
  // A server component, so it resolves its own copy. `getTranslator` is
  // `cache()`d per request, so the page and every card share one dictionary
  // read rather than one each.
  const t = await getTranslator(locale, ["projects"]);
  const still = PROJECT_STILLS[p.slug] ?? PROJECT_STILLS.sanctuary;
  const ready = p.status === "ready";

  return (
    <Link
      href={localizePath(`/projects/${p.slug}`, locale)}
      className="group relative block overflow-hidden rounded-[32px] bg-charcoal
                 shadow-[0_1px_2px_-1px_rgba(29,29,29,.14),0_18px_36px_-18px_rgba(29,29,29,.22),0_60px_110px_-50px_rgba(29,29,29,.3)]
                 transition-[transform,box-shadow] duration-[700ms] ease-[cubic-bezier(.16,1,.3,1)]
                 hover:-translate-y-1.5
                 hover:shadow-[0_2px_4px_-1px_rgba(29,29,29,.18),0_28px_56px_-22px_rgba(29,29,29,.28),0_80px_150px_-56px_rgba(29,29,29,.38)]
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B88A44]"
    >
      <div className="relative aspect-[16/12] w-full overflow-hidden md:aspect-[21/10]">
        <Image
          src={stillUrl(still.hero)}
          alt={`${p.name} — ${p.location}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
          priority={priority}
          className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.045]"
        />

        {/*
          Two gradients, not one. The lower band carries the type; the upper
          veil keeps the badges legible over a bright sky without darkening the
          middle of the photograph, which is the part worth looking at.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-[900ms] group-hover:opacity-[0.94]"
          style={{
            background:
              "linear-gradient(to top, rgba(21,21,21,.95) 0%, rgba(21,21,21,.78) 30%, rgba(21,21,21,.2) 58%, rgba(21,21,21,0) 76%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-32"
          style={{
            background:
              "linear-gradient(to bottom, rgba(21,21,21,.5) 0%, rgba(21,21,21,0) 100%)",
          }}
        />

        <div className="absolute left-7 top-7 flex flex-wrap items-center gap-2 md:left-10 md:top-10">
          <span className="rounded-full bg-[#B88A44] px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-[#1D1D1D]">
            {p.approval}
          </span>
          <span
            className={`rounded-full px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] ${
              ready ? "bg-white text-[#1D1D1D]" : "bg-[#1D1D1D] text-white"
            }`}
          >
            {ready ? t("projects.card.nowSelling") : t("projects.card.registeringInterest")}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-7 md:p-12">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-7">
            <div className="min-w-0 max-w-2xl">
              <p className="text-[0.8125rem] font-medium uppercase tracking-[0.22em] text-[#E8D9BB]">
                {p.location}
              </p>
              <h2 className="display mt-4 text-[clamp(2rem,4.2vw,3.4rem)] leading-[1.02] text-white">
                {p.name}
              </h2>
              <p className="mt-4 max-w-xl text-[1.0625rem] leading-[1.65] text-[#DCD7CE]">
                {p.headline}
              </p>
            </div>

            {/* the arrow travels; the label holds still */}
            <span className="flex items-center gap-4 text-white">
              <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.2em]">
                {ready ? t("projects.card.explore") : t("projects.card.register")}
              </span>
              <span
                aria-hidden="true"
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[#B88A44]
                           transition-[background-color,transform] duration-[600ms] ease-[cubic-bezier(.16,1,.3,1)]
                           group-hover:translate-x-1 group-hover:bg-[#B88A44]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  className="text-white transition-colors duration-[600ms] group-hover:text-[#1D1D1D]"
                >
                  <path d="M3 9h11M9.5 4l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </div>

          {/* the four numbers a buyer actually compares */}
          <dl className="mt-9 grid grid-cols-2 gap-x-10 gap-y-5 border-t border-[rgba(184,138,68,.3)] pt-7 sm:grid-cols-4">
            {[
              { k: t("projects.card.extent"), v: p.acreage },
              { k: t("projects.card.plotSizes"), v: p.plotSizes },
              { k: t("projects.card.availability"), v: p.plots },
              { k: t("projects.card.priceFrom"), v: p.priceFrom },
            ].map((spec) => (
              <div key={spec.k}>
                <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-[#B6AFA3]">
                  {spec.k}
                </dt>
                <dd className="display mt-2 text-xl tabular-nums text-white">{spec.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Link>
  );
}
