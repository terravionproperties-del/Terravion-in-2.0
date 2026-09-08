import { site, absoluteUrl } from "@/lib/site";
import type { Project, Faq } from "@/lib/types";
import { DEFAULT_LOCALE, LOCALE_META, localizePath, type Locale } from "@/lib/i18n/config";
import { resolveAuthor, resolveReviewer, type Author } from "@/lib/authors";

/** JSON-LD builders. Rendered via <script type="application/ld+json"> in server components. */

/**
 * Absolute URL for a path in a given language.
 *
 * Every `url`, `@id` and breadcrumb `item` below goes through this. Structured
 * data that points at the English URL from a Telugu page tells Google the two
 * are the same document, which quietly undoes the hreflang work in lib/seo.ts.
 */
function localizedUrl(path: string, locale: Locale = DEFAULT_LOCALE): string {
  return absoluteUrl(localizePath(path, locale));
}

/**
 * The organisation node is shared across languages by design.
 *
 * There is one Terravion Properties, with one address and one phone number, so
 * the `@id` stays language-neutral and every localised page points at the same
 * entity. Only `inLanguage` varies — it describes the page you are reading, not
 * the company.
 */
export function organizationSchema(locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "RealEstateAgent", "LocalBusiness"],
    "@id": `${site.domain}/#organization`,
    name: site.name,
    alternateName: [
      "Terravion",
      "Terravion Properties",
      "Terravion Properties Hyderabad",
      "South Pride Sanctuary",
      "South Pride by Sanctuary",
      "SouthPride Sanctuary",
      "Raghunath County",
      "Raghnath County",
      "Shankarpally Plots",
      "The Sanctuary Shankarpally",
    ],
    url: site.domain,
    description: site.description,
    slogan: site.tagline,
    telephone: site.phone,
    email: site.email,
    logo: absoluteUrl("/icon.svg"),
    image: absoluteUrl("/opengraph-image"),
    priceRange: site.priceRange,
    openingHours: site.hours,
    brand: {
      "@type": "Brand",
      name: site.name,
      alternateName: "Terravion",
    },
    knowsAbout: [
      "Shankarpally Plots",
      "Shankarpallly Polts",
      "Plots in Shankarpally",
      "South Pride Sanctuary",
      "South Pride by Sanctuary",
      "SouthPride Sanctuary Shankarpally",
      "Raghunath County",
      "Raghnath County",
      "Raghnath County Shankarpally",
      "Luxury Villa Plots Hyderabad",
      "HMDA Approved Plots Shankarpally",
      "DTCP Approved Plots Shankarpally",
      "The Sanctuary Villa Plots",
      "West Hyderabad Real Estate Investment",
      "Gated Community Villa Plots",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.lat,
      longitude: site.geo.lng,
    },
    areaServed: [
      {
        "@type": "Place",
        name: "Shankarpally",
        sameAs: [
          "https://en.wikipedia.org/wiki/Shankarpalli",
          "https://www.wikidata.org/wiki/Q7488735",
        ],
      },
      {
        "@type": "City",
        name: "Hyderabad",
        sameAs: [
          "https://en.wikipedia.org/wiki/Hyderabad",
          "https://www.wikidata.org/wiki/Q1361",
        ],
      },
      { "@type": "Place", name: "Mokila" },
      { "@type": "Place", name: "West Hyderabad" },
      {
        "@type": "State",
        name: "Telangana",
        sameAs: "https://en.wikipedia.org/wiki/Telangana",
      },
    ],
    sameAs: Object.values(site.social),
    inLanguage: LOCALE_META[locale].bcp47,
  };
}

export function websiteSchema(locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${localizedUrl("/", locale)}#website`,
    url: localizedUrl("/", locale),
    name: site.name,
    alternateName: "Terravion Properties",
    inLanguage: LOCALE_META[locale].bcp47,
    publisher: { "@id": `${site.domain}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.domain}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
  locale: Locale = DEFAULT_LOCALE
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: localizedUrl(item.path, locale),
    })),
  };
}

export function faqSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function projectSchema(project: Project, locale: Locale = DEFAULT_LOCALE) {
  const isSanctuary = project.slug === "sanctuary";
  const isRaghunath = project.slug === "raghunath-county";

  const alternateNames = isSanctuary
    ? [
        "South Pride Sanctuary",
        "SouthPride Sanctuary",
        "South Pride by Sanctuary",
        "Sanctuary Shankarpally",
        "The Sanctuary Shankarpally",
        "Sanctuary by Terravion",
        "Shankarpally Plots Sanctuary",
      ]
    : isRaghunath
    ? [
        "Raghnath County",
        "Raghunath County Shankarpally",
        "Raghnath County Shankarpally",
        "Raghunath County Plots",
        "Raghnath County Plots Shankarpally",
      ]
    : [project.name];

  const geoCoordinates = isSanctuary
    ? { latitude: 17.4812, longitude: 78.1105 }
    : isRaghunath
    ? { latitude: 17.4625, longitude: 78.102 }
    : { latitude: site.geo.lat, longitude: site.geo.lng };

  return {
    "@context": "https://schema.org",
    "@type": ["Residence", "RealEstateListing", "Place"],
    "@id": `${localizedUrl(`/projects/${project.slug}`, locale)}#residence`,
    name: `${project.name} | Terravion`,
    alternateName: alternateNames,
    description: project.metaDescription,
    url: localizedUrl(`/projects/${project.slug}`, locale),
    inLanguage: LOCALE_META[locale].bcp47,
    geo: {
      "@type": "GeoCoordinates",
      latitude: geoCoordinates.latitude,
      longitude: geoCoordinates.longitude,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: project.location,
      addressLocality: "Shankarpally",
      addressRegion: "Telangana",
      postalCode: "501203",
      addressCountry: "IN",
    },
    containedInPlace: {
      "@type": "Place",
      name: "Shankarpally",
      addressLocality: "Shankarpally",
      addressRegion: "Telangana",
      sameAs: [
        "https://en.wikipedia.org/wiki/Shankarpalli",
        "https://www.wikidata.org/wiki/Q7488735",
      ],
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "4500000",
      price: "4500000",
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
      url: localizedUrl(`/projects/${project.slug}`, locale),
    },
    amenityFeature: project.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true,
    })),
  };
}

export function offerCatalogSchema(items: Project[], locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `${site.name} — Shankarpally Plots (South Pride Sanctuary & Raghunath County)`,
    itemListElement: items.map((p) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": ["Residence", "RealEstateListing"],
        name: p.name,
        url: localizedUrl(`/projects/${p.slug}`, locale),
        description: p.metaDescription,
        price: "4500000",
        priceCurrency: "INR",
      },
      availability:
        p.status === "ready"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
    })),
  };
}

/**
 * A Person node for a verified author, or the organisation when there is none.
 *
 * `resolveAuthor` never returns a placeholder, so this cannot emit a Person
 * with invented credentials — see the reasoning in lib/authors.ts.
 */
function authorNode(author: Author) {
  if (author.id === "terravion") {
    return { "@id": `${site.domain}/#organization` };
  }
  return {
    "@type": "Person",
    ...(author.url ? { "@id": `${author.url}#person`, url: author.url } : {}),
    name: author.name,
    jobTitle: author.role,
    description: author.bio,
    ...(author.credentials.length
      ? {
          hasCredential: author.credentials.map((c) => ({
            "@type": "EducationalOccupationalCredential",
            name: c,
          })),
        }
      : {}),
    ...(author.image ? { image: absoluteUrl(author.image) } : {}),
    ...(author.sameAs?.length ? { sameAs: [...author.sameAs] } : {}),
    worksFor: { "@id": `${site.domain}/#organization` },
  };
}

/**
 * Article schema for any editorial route — journal, guides or locations.
 *
 * Two bugs this signature exists to prevent:
 *
 *   1. The path was hardcoded to `/blog/`, so a guide's schema advertised a URL
 *      that 404s. `basePath` makes the route explicit.
 *   2. `locale` defaulted to English and every call site omitted it, so the
 *      Telugu and Hindi pages emitted English `url`, `mainEntityOfPage` and
 *      `inLanguage`. Structured data claiming a different URL than the page's
 *      own canonical contradicts the hreflang work in lib/seo.ts — and Google
 *      resolves that contradiction by trusting neither signal.
 *
 * `reviewedBy` is emitted only when a real reviewer is registered, because
 * "reviewed by" asserts that a review actually happened.
 */
export function articleSchema(
  post: {
    slug: string;
    title: string;
    metaDescription: string;
    published?: string;
    updated: string;
    authorId?: string;
    reviewerId?: string;
    image?: string | null;
    section?: string | null;
    wordCount?: number;
  },
  locale: Locale = DEFAULT_LOCALE,
  basePath: "/blog" | "/guides" | "/locations" = "/blog"
) {
  const url = localizedUrl(`${basePath}/${post.slug}`, locale);
  const author = resolveAuthor(post.authorId);
  const reviewer = resolveReviewer(post.reviewerId);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    url,
    inLanguage: LOCALE_META[locale].bcp47,
    ...(post.published ? { datePublished: post.published } : {}),
    dateModified: post.updated,
    author: authorNode(author),
    ...(reviewer ? { reviewedBy: authorNode(reviewer) } : {}),
    publisher: { "@id": `${site.domain}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(post.image ? { image: absoluteUrl(post.image) } : {}),
    ...(post.section ? { articleSection: post.section } : {}),
    ...(post.wordCount ? { wordCount: post.wordCount } : {}),
    isAccessibleForFree: true,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".article-intro"],
    },
  };
}

/**
 * CollectionPage + ItemList for listing routes (journal index, guides index,
 * locations index, projects index).
 *
 * This is what lets an AI search engine answer "what guides does Terravion
 * publish?" from an ordered list rather than a guess, and it is the difference
 * between a listing page being read as a hub and being treated as thin.
 */
export function collectionSchema(
  collection: {
    name: string;
    description: string;
    path: string;
    items: ReadonlyArray<{ name: string; path: string }>;
  },
  locale: Locale = DEFAULT_LOCALE
) {
  const url = localizedUrl(collection.path, locale);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    name: collection.name,
    description: collection.description,
    url,
    inLanguage: LOCALE_META[locale].bcp47,
    isPartOf: { "@id": `${site.domain}/#website` },
    publisher: { "@id": `${site.domain}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: collection.items.length,
      itemListElement: collection.items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: localizedUrl(item.path, locale),
      })),
    },
  };
}

/**
 * HowTo for procedural guides (registration, verification, loan process).
 *
 * Only pass steps a guide genuinely lays out in order. A HowTo whose steps do
 * not correspond to headings on the page is structured-data spam, and Google
 * checks that correspondence.
 */
export function howToSchema(
  howTo: {
    name: string;
    description: string;
    path: string;
    steps: ReadonlyArray<{ name: string; text: string }>;
    totalTime?: string;
  },
  locale: Locale = DEFAULT_LOCALE
) {
  const url = localizedUrl(howTo.path, locale);
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howTo.name,
    description: howTo.description,
    url,
    inLanguage: LOCALE_META[locale].bcp47,
    ...(howTo.totalTime ? { totalTime: howTo.totalTime } : {}),
    publisher: { "@id": `${site.domain}/#organization` },
    step: howTo.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${url}#step-${i + 1}`,
    })),
  };
}

/** Serialize for <script type="application/ld+json"> */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
