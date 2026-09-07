import { nav } from "@/lib/site";
import { localizePath, type Locale } from "./config";
import type { Translator } from "./dictionaries";

/**
 * Turns the hardcoded English nav in `lib/site.ts` into localised links.
 *
 * The hrefs stay where they are. `lib/site.ts` is business data — it says which
 * sections the site has — and that does not change per language. Only the label
 * does, so only the label is looked up. Keying on href rather than on array
 * position means reordering the nav cannot silently relabel it.
 *
 * `/blog` maps to `navigation.journal` on purpose. The section is called the
 * Journal in every language; the URL has been `/blog` since launch and is what
 * the sitemap, the RSS feed and every inbound link already point at. Renaming
 * the route to match the label would trade a hundred-odd redirects for nothing
 * a reader can see.
 */
const NAV_KEY: Record<string, string> = {
  "/projects": "navigation.projects",
  "/gis": "navigation.gis",
  "/locations": "navigation.locations",
  "/investment": "navigation.investment",
  "/guides": "navigation.guides",
  "/blog": "navigation.journal",
  "/gallery": "navigation.gallery",
  "/about": "navigation.about",
  "/contact": "navigation.contact",
};

export interface NavItem {
  /** Canonical, unprefixed path — used for active-state matching. */
  readonly path: string;
  /** The href actually rendered, prefixed for non-default locales. */
  readonly href: string;
  readonly label: string;
}

export function localizedNav(t: Translator, locale: Locale): NavItem[] {
  return nav.map((item) => ({
    path: item.href,
    href: localizePath(item.href, locale),
    label: NAV_KEY[item.href] ? t(NAV_KEY[item.href]) : item.label,
  }));
}
