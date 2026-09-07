import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { locations } from "@/content/locations";
import { breadcrumbSchema, collectionSchema, jsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";
import { formatNumber } from "@/lib/i18n/format";
import { getCollection } from "@/lib/content/translated";

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
    title: t("metadata.locations.title"),
    description: t("metadata.locations.description"),
    path: "/locations",
    locale,
  });
}

/**
 * Drive time is authored as English display text — "35 min", "≈ 45 min", "—".
 *
 * Rather than duplicate the field per language (and let the two drift), the
 * minutes are read back out and re-rendered through the dictionary, so the
 * numeral and the unit both localise and the "approximately" marker survives.
 * A value with no digits in it is decoration, not data, and is dropped.
 */
function parseDriveTime(raw: string): { minutes: number; approx: boolean } | null {
  const digits = /(\d+)/.exec(raw);
  if (!digits) return null;
  return { minutes: Number(digits[1]), approx: /[≈~]/.test(raw) };
}

export default async function LocationsIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, ["locations", "navigation", "common"]);

  // Never filtered — see lib/content/translated.ts. Every locality renders in
  // every language; only its text and its badge differ.
  const collection = await getCollection("locations", locations, locale);

  // Distance and drive time are structural, so they stay on the English master
  // and are looked up by slug rather than copied into the translation layer.
  // That is what stops a Telugu page from ever showing a stale kilometre.
  const structural = new Map(locations.map((l) => [l.slug, l]));

  const sorted = [...collection].sort(
    (a, b) =>
      (structural.get(a.metadata.slug)?.distanceFromShankarpallyKm ?? 0) -
      (structural.get(b.metadata.slug)?.distanceFromShankarpallyKm ?? 0)
  );

  /**
   * Every card stays inside the reader's language.
   *
   * Sending untranslated localities to the English URL dropped the reader out
   * of Telugu mid-journey — header, navigation and footer all reverted, and the
   * language they had chosen looked discarded. The note route now renders
   * in-locale whatever the state of the body.
   */
  const hrefFor = (slug: string) => localizePath(`/locations/${slug}`, locale);

  const distanceLabel = (slug: string) => {
    const src = structural.get(slug);
    if (!src) return "";
    if (src.distanceFromShankarpallyKm === 0) return t("locations.homeGround");

    const km = t("locations.distanceKm", {
      distance: formatNumber(src.distanceFromShankarpallyKm, locale),
    });
    const drive = parseDriveTime(src.driveTimeFromShankarpally);
    if (!drive) return km;

    const minutes = formatNumber(drive.minutes, locale);
    const time = drive.approx
      ? t("locations.driveApprox", { minutes })
      : t("locations.driveMinutes", { minutes });
    return `${km} · ${time}`;
  };

  return (
    <>
      {/*
        CollectionPage + ItemList.
        Without it a hub page is just a wall of links, and an engine asked
        "which localities does Terravion cover?" has to infer the answer from
        markup. This states it: an ordered list, in reading order, in the
        reader's language.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            collectionSchema(
              {
                name: `${t("locations.headlineLead")} ${t("locations.headlineEmphasis")}`.trim(),
                description: t("locations.intro"),
                path: "/locations",
                // `metadata.title` is the localised name — the same string the
                // cards below render, so the structured list and the visible
                // list can never disagree.
                items: sorted.map((c) => ({
                  name: c.metadata.title,
                  path: `/locations/${c.metadata.slug}`,
                })),
              },
              locale
            )
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("navigation.locations"), path: "/locations" },
            ])
          ),
        }}
      />
      <section className="bg-ivory pb-24 pt-40 md:pb-32 md:pt-52">
        <div className="shell">
          <Reveal>
            <p className="label text-gold-ink">{t("locations.eyebrow")}</p>
            <h1 className="display mt-5 max-w-3xl text-5xl leading-[1.02] text-ink md:text-7xl">
              {t("locations.headlineLead")}{" "}
              <em className="text-gold-ink">{t("locations.headlineEmphasis")}</em>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">
              {t("locations.intro")}
            </p>
          </Reveal>

          <div className="mt-16 flex items-center justify-between border-b border-ink/10 pb-4">
            <h2 className="label text-gold-ink">{t("locations.allLocations")}</h2>
            <span className="font-mono text-xs text-text-muted">
              {t("locations.locationsCount", { count: sorted.length })}
            </span>
          </div>

          <div className="flex flex-col" aria-label={t("locations.listAria")}>
            {sorted.map((item, i) => {
              const { metadata: m, status } = item;
              // `metadata` carries the localised name and epithet the moment a
              // card translation lands; `content` stays null until the body
              // itself is translated.
              const lang = m.textLocale === locale ? undefined : m.textLocale;

              return (
                <Reveal key={m.slug} delay={Math.min(i, 4) * 0.04}>
                  <Link
                    href={hrefFor(m.slug)}
                    className="group grid grid-cols-1 gap-2 border-b border-ink/10 py-8 transition-colors md:grid-cols-[14rem_1fr_auto] md:items-baseline md:gap-8"
                  >
                    <h3 className="display text-2xl text-ink transition-colors group-hover:text-gold-ink md:text-3xl">
                      <span lang={lang}>{m.title}</span>
                    </h3>
                    <p className="text-sm leading-relaxed text-text-secondary md:text-base">
                      <span lang={lang}>{m.excerpt}</span>
                      {status !== "translated" && (
                        <span
                          className="ms-3 align-middle rounded-full px-2.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.14em]"
                          style={{ background: "#F1EBE2", color: "#8A6736" }}
                        >
                          {t("common.translationStatus.missing")}
                        </span>
                      )}
                    </p>
                    <p className="label text-text-muted">{distanceLabel(m.slug)}</p>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
