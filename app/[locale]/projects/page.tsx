import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import ProjectCard from "@/components/projects/ProjectCard";
import { projects } from "@/lib/data/projects";
import { breadcrumbSchema, collectionSchema, offerCatalogSchema, jsonLd } from "@/lib/schema";
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
    title: t("metadata.projects.title"),
    description: t("metadata.projects.description"),
    path: "/projects",
    locale,
  });
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, ["projects", "navigation"]);

  return (
    <>
      {/*
        CollectionPage + ItemList, alongside — not instead of — the offer
        catalogue. The catalogue says what is for sale; this says what the page
        *is*: an ordered hub listing every community, in the order the cards
        render, at this locale's URLs. Without it an engine has to infer the
        portfolio from markup rather than read it.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            collectionSchema(
              {
                name: `${t("projects.indexHeadlineLead")} ${t("projects.indexHeadlineEmphasis")}`.trim(),
                description: t("projects.indexApprovalNote"),
                path: "/projects",
                // `projects` is a plain array — not a getCollection() result —
                // so the fields are `name` and `slug` directly. `name` is the
                // same string ProjectCard renders in its heading, and every
                // slug has a page at /projects/[slug].
                items: projects.map((p) => ({
                  name: p.name,
                  path: `/projects/${p.slug}`,
                })),
              },
              locale
            )
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(offerCatalogSchema([...projects])) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("navigation.projects"), path: "/projects" },
            ])
          ),
        }}
      />
      <section className="bg-ivory pb-24 pt-40 md:pb-32 md:pt-52">
        <div className="shell">
          <Reveal>
            <p className="label text-gold-ink">{t("projects.indexPortfolioEyebrow")}</p>
            <h1 className="display mt-5 max-w-3xl text-5xl leading-[1.02] text-ink md:text-7xl">
              {t("projects.indexHeadlineLead")}{" "}
              <em className="text-gold-ink">{t("projects.indexHeadlineEmphasis")}</em>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">
              {t("projects.indexApprovalNote")}
            </p>
          </Reveal>

          <div className="mt-20 flex flex-col gap-12 md:gap-16">
            {projects.map((p, i) => (
              <Reveal key={p.slug}>
                <ProjectCard project={p} locale={locale} priority={i === 0} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
