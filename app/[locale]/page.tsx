import type { Metadata } from "next";
import FilmExperience from "@/components/film/FilmExperience";
import AfterFilm from "@/components/home/AfterFilm";
import { projects } from "@/lib/data/projects";
import { offerCatalogSchema, jsonLd } from "@/lib/schema";
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
    title: t("metadata.home.title"),
    description: t("metadata.home.description"),
    path: "/",
    locale,
  });
}

/**
 * The homepage is the film.
 *
 * Scroll scrubs a continuous 90-second reel shot over Terravion's land, and
 * the writing is choreographed into it — each line placed in a window of the
 * footage that is verified clear of the presenter, of signage, and of the
 * film's own baked-in typography. There is no "hero followed by sections":
 * the reel runs, then keeps running through the closing panels.
 *
 * Every word rendered by FilmExperience is real DOM text, present in the
 * server-rendered HTML, so the experience costs nothing in crawlability.
 */
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(offerCatalogSchema([...projects])),
        }}
      />
      <FilmExperience />
      <AfterFilm />
    </>
  );
}
