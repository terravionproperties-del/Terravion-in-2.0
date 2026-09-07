"use client";

import Link from "next/link";
import { usePointerLight } from "@/components/ui/usePointerLight";
import { projects } from "@/lib/data/projects";
import { stillUrl } from "@/lib/film";
import { localizePath, type Locale } from "@/lib/i18n/config";

/**
 * The menu behind "Projects", "Locations" and "Guides".
 *
 * Capped at 420px tall and built from three floating panels rather than a
 * column of links: one featured community with its own frame from the reel, a
 * short list of destinations, and a booking prompt. It is a vitrine, not a
 * table of contents.
 */

export type MenuKey = "projects" | "locations" | "guides" | null;

/**
 * Slugs only. The labels and the notes are copy, so they live in
 * locales/<lang>/navigation.json under `megaMenu.places`,
 * `megaMenu.destinationNotes` and `megaMenu.readingLabels`, keyed by these same
 * slugs. The route list stays here; the words stay with the words.
 */
const DESTINATION_SLUGS = [
  "shankarpally",
  "mokila",
  "kokapet",
  "tellapur",
  "financial-district",
  "orr-corridor",
] as const;

const READING_SLUGS = [
  "hmda-guide",
  "legal-verification",
  "registration-process",
  "investment-checklist",
] as const;

export interface MegaMenuStrings {
  projectsHeading: string;
  locationsHeading: string;
  guidesHeading: string;
  latest: string;
  allEssays: string;
  bookVisit: string;
  featuredCaption: string;
  latestArticle: { title: string; excerpt: string };
  /** Resolved by the layout: the locale URL when translated, English when not. */
  latestArticleHref: string;
  places: Record<string, string>;
  destinationNotes: Record<string, string>;
  readingLabels: Record<string, string>;
}

export default function MegaMenu({
  open,
  locale,
  strings,
}: {
  open: MenuKey;
  locale: Locale;
  strings: MegaMenuStrings;
}) {
  const light = usePointerLight<HTMLDivElement>();
  const featured = projects.find((p) => p.slug === "sanctuary")!;

  const columns =
    open === "locations"
      ? {
          title: strings.locationsHeading,
          items: DESTINATION_SLUGS.map((slug) => ({
            label: strings.places[slug] ?? slug,
            href: localizePath(`/locations/${slug}`, locale),
            note: strings.destinationNotes[slug] ?? "",
          })),
        }
      : open === "guides"
        ? {
            title: strings.guidesHeading,
            items: READING_SLUGS.map((slug) => ({
              label: strings.readingLabels[slug] ?? slug,
              href: localizePath(`/guides/${slug}`, locale),
              note: "",
            })),
          }
        : {
            title: strings.projectsHeading,
            items: projects.map((p) => ({
              label: p.shortName,
              href: localizePath(`/projects/${p.slug}`, locale),
              note: p.approval,
            })),
          };

  return (
    <div
      ref={light.ref}
      onPointerMove={light.onPointerMove}
      onPointerLeave={light.onPointerLeave}
      aria-hidden={!open}
      className={`pointer-events-none absolute left-1/2 top-[96px] w-[min(1080px,calc(100vw-3rem))] -translate-x-1/2 transition-all duration-500 ${
        open
          ? "translate-y-0 opacity-100 [&>*]:pointer-events-auto"
          : "-translate-y-3 opacity-0"
      }`}
    >
      {/*
        A solid ivory panel, not glass. A menu that shows the page through
        itself is a menu you have to squint at; this one is a physical sheet
        laid over the page. Three equal columns so the eye has one rhythm
        instead of three widths.
      */}
      <div
        className="grid grid-cols-1 gap-10 rounded-[32px] bg-white p-8 md:grid-cols-3 md:p-10"
        style={{
          border: "1px solid rgba(184,138,68,.15)",
          boxShadow: "0 8px 24px rgba(0,0,0,.08), 0 30px 80px rgba(0,0,0,.12)",
        }}
      >
        {/* 1 — featured community */}
        <Link
          prefetch={false}
          href={localizePath(`/projects/${featured.slug}`, locale)}
          className="group flex flex-col gap-5"
        >
          <div className="relative h-[340px] w-full overflow-hidden rounded-[24px] bg-[#F1EBE2]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              style={{ backgroundImage: `url(${stillUrl(1010)})` }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(21,21,21,.9) 0%, rgba(21,21,21,.35) 45%, rgba(21,21,21,0) 72%)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-[0.8125rem] font-medium uppercase tracking-[0.2em] text-[#E8D9BB]">
                {featured.approval}
              </p>
              <p className="display mt-2 text-[30px] leading-tight text-white">
                {featured.shortName}
              </p>
              <p className="mt-2 text-[15px] leading-snug text-[#DCD7CE]">
                {strings.featuredCaption}
              </p>
            </div>
          </div>
        </Link>

        {/* 2 — communities */}
        <div className="flex flex-col gap-5">
          <p className="text-[0.8125rem] font-medium uppercase tracking-[0.2em] text-[#777777]">
            {columns.title}
          </p>
          <ul className="flex flex-col">
            {columns.items.map((item) => (
              <li key={item.href} style={{ borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                <Link
                  prefetch={false}
                  href={item.href}
                  className="flex items-baseline justify-between gap-4 text-[#222222] transition-[color,transform] duration-300 ease-out hover:translate-x-2 hover:text-[#B88A44]"
                  style={{ paddingBlock: "18px" }}
                >
                  <span className="text-[16px]">{item.label}</span>
                  {item.note && (
                    <span className="shrink-0 text-[0.8125rem] uppercase tracking-[0.16em] text-[#777777]">
                      {item.note}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 3 — latest article + the way in */}
        <div className="flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-5">
            <p className="text-[0.8125rem] font-medium uppercase tracking-[0.2em] text-[#777777]">
              {strings.latest}
            </p>
            <Link
              prefetch={false}
              href={strings.latestArticleHref}
              className="group block"
            >
              <p className="display text-[30px] leading-[1.12] text-[#222222] transition-colors group-hover:text-[#B88A44]">
                {strings.latestArticle.title}
              </p>
              <p className="mt-3 text-[16px] leading-[1.6] text-[#595959]">
                {strings.latestArticle.excerpt}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-[#8A6736]">
                {strings.allEssays}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </span>
            </Link>
          </div>

          <Link
            prefetch={false}
            href={localizePath("/site-visit", locale)}
            className="inline-flex h-14 items-center justify-center rounded-full text-[15px] font-semibold text-[#1D1D1D] transition-[background-color,transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5"
            style={{
              paddingInline: "36px",
              background: "#B88A44",
              boxShadow: "0 6px 18px rgba(138,103,54,.25)",
            }}
          >
            {strings.bookVisit}
          </Link>
        </div>
      </div>
    </div>
  );
}
