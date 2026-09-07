/** Shared content model for all generated pages. */

export interface Faq {
  q: string;
  a: string;
}

export interface DistanceEntry {
  place: string;
  distanceKm: number;
  driveTime: string;
}

export interface Project {
  slug: string;
  name: string;
  shortName: string;
  /** e.g. "HMDA Approved" | "DTCP Approved" */
  approval: string;
  status: "ready" | "upcoming";
  location: string;
  acreage: string;
  plots: string;
  plotSizes: string;
  roads: string;
  priceFrom: string;
  headline: string;
  /** one-paragraph cinematic intro */
  intro: string;
  /** long-form narrative paragraphs */
  narrative: string[];
  highlights: { label: string; value: string }[];
  amenities: string[];
  distances: DistanceEntry[];
  faqs: Faq[];
  /** hue used by the generative art direction for this project */
  accent: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export interface LocationContent {
  slug: string;
  name: string;
  /** e.g. "West Hyderabad's education corridor" */
  epithet: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  intro: string;
  /** markdown body, H2/H3 structured, 1200+ words, unique per location */
  body: string;
  distanceFromShankarpallyKm: number;
  driveTimeFromShankarpally: string;
  faqs: Faq[];
}

export interface GuideContent {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  intro: string;
  /** markdown body, H2/H3 structured, 1500+ words */
  body: string;
  faqs: Faq[];
  /** ISO date YYYY-MM-DD */
  updated: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  category:
    | "Investment"
    | "Locations"
    | "Guides"
    | "Market Trends"
    | "Lifestyle"
    | "Infrastructure"
    | "Legal & Tax";
  excerpt: string;
  /** markdown body, H2/H3 structured, 2000+ words, unique */
  body: string;
  /** ISO date YYYY-MM-DD */
  published: string;
  updated: string;
  readingMinutes: number;
  faqs?: Faq[];
}
