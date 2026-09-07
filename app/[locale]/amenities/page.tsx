import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { projects } from "@/lib/data/projects";
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
    title: t("metadata.amenities.title"),
    description: t("metadata.amenities.description"),
    path: "/amenities",
    locale,
  });
}

export default async function AmenitiesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, ["projects", "metadata"]);
  const ready = projects.filter((p) => p.status === "ready");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("metadata.amenities.title"), path: "/amenities" },
            ])
          ),
        }}
      />
      <section className="bg-ivory pb-24 pt-40 md:pb-32 md:pt-52">
        <div className="shell">
          <Reveal>
            <p className="label text-gold-ink">{t("projects.amenitiesPage.eyebrow")}</p>
            <h1 className="display mt-5 max-w-3xl text-5xl leading-[1.02] text-ink md:text-7xl">
              {t("projects.amenitiesPage.headlineLead")}
              <em className="text-gold-ink"> {t("projects.amenitiesPage.headlineEmphasis")}</em>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">
              {t("projects.amenitiesPage.intro")}
            </p>
          </Reveal>

          {ready.map((p) => (
            <Reveal key={p.slug} className="mt-20">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="display text-3xl text-ink md:text-5xl">{p.name}</h2>
                <p className="label text-text-muted">
                  {p.approval} · {p.acreage}
                </p>
              </div>
              <div className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {p.amenities.map((a) => (
                  <p key={a} className="border-b border-ink/10 pb-4 text-base text-text-secondary">
                    {a}
                  </p>
                ))}
              </div>
              <Link
                href={localizePath(`/projects/${p.slug}`, locale)}
                className="label mt-8 inline-block text-gold-ink underline-offset-8 hover:underline"
              >
                {t("projects.amenitiesPage.explore", { project: p.shortName })}
              </Link>
            </Reveal>
          ))}

          <Reveal className="mt-24 rounded-3xl border border-gold/20 bg-travertine p-10 text-charcoal md:p-16">
            <h2 className="display text-3xl md:text-4xl">
              {t("projects.amenitiesPage.clubhouseTitle")}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
              {t("projects.amenitiesPage.clubhouseBody")}
            </p>
            <Link
              href={localizePath("/site-visit", locale)}
              className="label mt-8 inline-block rounded-full bg-brass px-8 py-4 text-white transition-colors hover:bg-gold hover:text-charcoal"
            >
              {t("projects.amenitiesPage.clubhouseCta")}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
