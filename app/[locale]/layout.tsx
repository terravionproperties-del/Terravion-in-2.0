import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import "../globals.css";
import SmoothScroll from "@/components/providers/SmoothScroll";
import DOMSafetyPatch from "@/components/providers/DOMSafetyPatch";
import Header from "@/components/layout/Header";
import CinematicEnding from "@/components/layout/CinematicEnding";
import StickyCta from "@/components/layout/StickyCta";
import MobileDock from "@/components/layout/MobileDock";
import WhatsAppBubble from "@/components/layout/WhatsAppBubble";
import Analytics from "@/components/analytics/Analytics";
import ConsentBanner from "@/components/analytics/ConsentBanner";
import WebVitals from "./web-vitals";

import { site } from "@/lib/site";
import { BING_SITE_VERIFICATION, GOOGLE_SITE_VERIFICATION } from "@/lib/analytics";
import { organizationSchema, websiteSchema, jsonLd } from "@/lib/schema";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_META,
  isLocale,
  localizePath,
  type Locale,
} from "@/lib/i18n/config";

import { getTranslator } from "@/lib/i18n/dictionaries";
import { loadFonts } from "@/lib/i18n/fonts";
import { localizedNav } from "@/lib/i18n/nav";
import { isTranslated } from "@/lib/content/translated";
import { buildPageMetadata } from "@/lib/seo";

/** The essay the mega menu features. */
const FEATURED_ESSAY = "shankarpally-growth-story";

/**
 * The root layout, now parameterised by language.
 *
 * There is no `app/layout.tsx` any more. With every route living under
 * `[locale]`, this *is* the root — which is what lets `<html lang>` and `dir`
 * be per-request rather than a hardcoded `en-IN`. Next's own i18n routing guide
 * uses the same shape.
 *
 * `generateStaticParams` returns all three languages, so the whole site
 * prerenders three times at build. Nothing here is dynamic at request time: the
 * middleware does locale detection, and this layout only reads the segment it
 * was handed.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Read a group of sibling keys into a plain record.
 *
 * The mega menu keys its labels by content slug, so the shape it wants is
 * `{ mokila: "మోకిల", … }` rather than a translator function it cannot call
 * (it is a Client Component). Listing the slugs explicitly rather than walking
 * the JSON means a slug that loses its translation shows up as the slug, in
 * one place, instead of as `undefined` deep inside a render.
 */
function readGroup(
  dict: (key: string) => string,
  prefix: string,
  slugs: readonly string[]
): Record<string, string> {
  return Object.fromEntries(slugs.map((slug) => [slug, dict(`${prefix}.${slug}`)]));
}

/** A fourth locale in the URL is a 404, not a silently-English page. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale: Locale = raw;

  const t = await getTranslator(locale, ["metadata"]);

  const base = buildPageMetadata({
    title: t("metadata.defaultTitle"),
    description: t("metadata.defaultDescription"),
    path: "/",
    keywords: t.list("metadata.keywords"),
    locale,
    type: "website",
  });

  /**
   * Search Console and Bing Webmaster Tools ownership tokens.
   *
   * Emitted only when the variable is set, because an empty
   * `<meta name="google-site-verification" content="">` is not a no-op — it is
   * a claim of ownership with no token behind it, and it can make Search
   * Console refuse the property. Verifying by DNS TXT record instead is the
   * better long-term answer; this is the path that works on day one, and the
   * two can coexist.
   */
  const verification: NonNullable<Metadata["verification"]> = {
    ...(GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : {}),
    ...(BING_SITE_VERIFICATION ? { other: { "msvalidate.01": BING_SITE_VERIFICATION } } : {}),
  };

  return {
    ...base,
    ...(Object.keys(verification).length ? { verification } : {}),
    metadataBase: new URL(site.domain),
    title: {
      default: t("metadata.defaultTitle"),
      template: t("metadata.titleTemplate"),
    },
    authors: [{ name: site.name, url: site.domain }],
    creator: site.name,
    publisher: site.name,
    formatDetection: { telephone: true },
    alternates: {
      ...base.alternates,
      types: { "application/rss+xml": `${site.domain}/rss.xml` },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#191410",
  width: "device-width",
  initialScale: 1,
  // Deliberately no `maximumScale: 1`. Telugu and Devanagari carry more detail
  // per glyph than Latin at the same point size, so pinch-zoom is the
  // difference between readable and not for a share of this audience.
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const meta = LOCALE_META[locale];

  // Only this language's font CSS is pulled in — see lib/i18n/fonts/index.ts
  // for why the switch there cannot be collapsed into a template literal.
  const [fontVariables, t] = await Promise.all([
    loadFonts(locale),
    getTranslator(locale, ["navigation", "common", "buttons", "cta"]),
  ]);

  /**
   * Every string the chrome needs, resolved here and passed down.
   *
   * Verbose on purpose. The alternative — letting Header, MegaMenu and the dock
   * each call `getDictionary` — would either force them to be Server Components
   * (they cannot be; they own scroll and pointer state) or ship the dictionaries
   * to the browser. Prop drilling is the cheap price for neither.
   */
  const dict = (key: string) => t(key);

  const navItems = localizedNav(t, locale);

  const headerStrings = {
    primaryLabel: t("navigation.primaryLabel"),
    mobileLabel: t("navigation.mobileLabel"),
    openMenu: t("navigation.openMenu"),
    closeMenu: t("navigation.closeMenu"),
    bookVisit: t("navigation.bookVisit"),
    brandSuffix: t("common.brand.suffix"),
    homeAriaLabel: `${site.name} — ${t("navigation.home")}`,
  };

  const languageStrings = {
    label: t("common.language.label"),
    change: t("common.language.change"),
    current: t("common.language.current"),
    select: t("common.language.select"),
    searchPlaceholder: t("common.language.searchPlaceholder"),
    chooseHint: t("common.language.chooseHint"),
    close: t("common.close"),
    searchLabel: t("common.search.label"),
    noResults: t("common.search.noResultsHint"),
  };

  const megaMenuStrings = {
    projectsHeading: dict("navigation.megaMenu.projectsHeading"),
    locationsHeading: dict("navigation.megaMenu.locationsHeading"),
    guidesHeading: dict("navigation.megaMenu.guidesHeading"),
    latest: dict("navigation.megaMenu.latest"),
    allEssays: dict("navigation.megaMenu.allEssays"),
    bookVisit: dict("navigation.megaMenu.bookVisit"),
    featuredCaption: dict("navigation.megaMenu.featuredCaption"),
    latestArticle: {
      title: dict("navigation.megaMenu.latestArticle.title"),
      excerpt: dict("navigation.megaMenu.latestArticle.excerpt"),
    },
    // The menu used to link at /te/blog/<slug> unconditionally, which 404s for
    // an essay that has no Telugu body. Point at whichever URL actually exists.
    latestArticleHref: localizePath(
      `/blog/${FEATURED_ESSAY}`,
      isTranslated("blog", FEATURED_ESSAY, locale) ? locale : DEFAULT_LOCALE
    ),
    places: readGroup(dict, "navigation.megaMenu.places", [
      "shankarpally",
      "mokila",
      "kokapet",
      "tellapur",
      "financial-district",
      "orr-corridor",
    ]),
    destinationNotes: readGroup(dict, "navigation.megaMenu.destinationNotes", [
      "shankarpally",
      "mokila",
      "kokapet",
      "tellapur",
      "financial-district",
      "orr-corridor",
    ]),
    readingLabels: readGroup(dict, "navigation.megaMenu.readingLabels", [
      "hmda-guide",
      "legal-verification",
      "registration-process",
      "investment-checklist",
    ]),
  };

  const dockStrings = {
    ariaLabel: dict("navigation.dock.ariaLabel"),
    homes: dict("navigation.dock.homes"),
    places: dict("navigation.dock.places"),
    journal: dict("navigation.dock.journal"),
    chat: dict("navigation.dock.chat"),
    chatAria: dict("navigation.dock.chatAria"),
    visit: dict("navigation.dock.visit"),
  };

  /**
   * The consent ask, in the reader's own language.
   *
   * Same reason the rest of the chrome is drilled through here: the banner owns
   * timing and localStorage, so it is a Client Component and cannot reach the
   * server-only dictionaries itself. The DPDP Act's notice requirement is the
   * reason this is not simply English — a consent notice a person cannot read
   * is not informed consent.
   */
  const consentStrings = {
    eyebrow: dict("common.consent.eyebrow"),
    body: dict("common.consent.body"),
    accept: dict("common.consent.accept"),
    decline: dict("common.consent.decline"),
    privacy: dict("common.consent.privacy"),
    ariaLabel: dict("common.consent.ariaLabel"),
  };

  const endingStrings = {
    ariaLabel: dict("cta.ending.ariaLabel"),
    eyebrow: dict("cta.ending.eyebrow"),
    titleLines: t.list("cta.ending.titleLines"),
    body: dict("cta.ending.body"),
    hours: dict("cta.ending.hours"),
    bookVisit: dict("cta.ending.bookVisit"),
    whatsapp: dict("cta.ending.whatsapp"),
    call: dict("cta.ending.call"),
    legalLabel: dict("cta.ending.legalLabel"),
    disclaimer: dict("cta.ending.disclaimer"),
    nav: {
      projects: dict("navigation.projects"),
      guides: dict("navigation.guides"),
      journal: dict("navigation.journal"),
      contact: dict("navigation.contact"),
      privacy: dict("navigation.privacy"),
      terms: dict("navigation.terms"),
    },
    rights: `© {year} ${site.legalName} · ${site.address.locality}, ${site.address.region}`,
  };

  return (
    <html
      lang={meta.bcp47}
      dir={meta.dir}
      data-locale={locale}
      translate="no"
      className={`notranslate ${fontVariables}`}
      suppressHydrationWarning
    >
      <body className="grain" suppressHydrationWarning>
        <DOMSafetyPatch />
        {/*
          Measurement, first in the body so the Consent Mode default is queued
          before any vendor tag can fire. Renders nothing at all when no
          measurement ID is configured — see components/analytics/Analytics.tsx.
        */}
        <Analytics />
        <WebVitals />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema(locale)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema(locale)) }}
        />
        <a href="#main" className="skip-link">
          {t("navigation.skipToContent")}
        </a>
        <SmoothScroll>
          <Header
            locale={locale}
            nav={navItems}
            strings={headerStrings}
            languageStrings={languageStrings}
            megaMenuStrings={megaMenuStrings}
            phone={site.phone}
            phoneHref={site.phoneHref}
          />
          <main id="main">{children}</main>
          <CinematicEnding locale={locale} strings={endingStrings} />
          <StickyCta
            locale={locale}
            label={dict("navigation.bookVisit")}
            whatsappAria={dict("navigation.dock.chatAria")}
            callAria={dict("buttons.callUs")}
          />
          <MobileDock locale={locale} strings={dockStrings} />
          <WhatsAppBubble
            strings={{
              openAria: dict("cta.whatsapp.openAria"),
              closeAria: dict("cta.whatsapp.closeAria"),
              title: dict("cta.whatsapp.title"),
              body: dict("cta.whatsapp.body"),
              cta: dict("cta.whatsapp.cta"),
              message: dict("cta.whatsapp.message"),
            }}
          />
          <ConsentBanner locale={locale} strings={consentStrings} />
        </SmoothScroll>
      </body>
    </html>
  );
}
