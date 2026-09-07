import { site } from "@/lib/site";

/**
 * Authorship and review registry — the E-E-A-T layer.
 *
 * Why this file exists
 * --------------------
 * Every article on this site currently declares `author: Organization`. That is
 * the weakest authorship signal available. Google's quality guidance, and every
 * AI search engine that cites sources, look for a named human with stated
 * experience — and "who wrote this, and what do they know?" is the first thing
 * a reader asks of a page telling them how to spend forty lakh rupees.
 *
 * The honest constraint
 * ---------------------
 * E-E-A-T cannot be fabricated. Inventing a "Senior Property Advocate, 15 years'
 * experience" to decorate a byline is exactly the deception the guidelines are
 * written against, and a reader who calls the office and finds no such person
 * has caught the site lying about the one thing it sells: trustworthiness.
 *
 * So this registry ships with real, verifiable entries only:
 *   · the organisation itself, which genuinely does publish this material, and
 *   · placeholder people, clearly marked, that emit NO schema until filled in.
 *
 * `isPublishable` is the gate. An author whose details are still placeholders
 * renders a plain organisational byline and contributes no Person schema —
 * because a Person node with invented credentials is worse than no Person node.
 *
 * To activate a human author: replace the placeholder fields with verified
 * facts, delete the `placeholder: true` flag, and the byline and schema light up
 * automatically everywhere that author is referenced.
 */

export interface Author {
  id: string;
  /** Display name. */
  name: string;
  /** Short role, e.g. "Founder" or "Property Advocate". */
  role: string;
  /**
   * One or two sentences of *specific, verifiable* experience. This is the
   * "Experience" in E-E-A-T — what this person has actually done, not adjectives.
   */
  bio: string;
  /** Professional credentials, if genuinely held. Empty is honest. */
  credentials: readonly string[];
  /** Profile URL on this site, if a page exists. */
  url?: string;
  /** Author photo, if a real one exists. */
  image?: string;
  /** Verifiable external profiles — used as schema `sameAs`. */
  sameAs?: readonly string[];
  /**
   * True while any field above is unverified. Placeholder authors render as the
   * organisation and emit no Person schema. Never set this to false to make a
   * byline appear; fill in the real facts instead.
   */
  placeholder?: boolean;
}

/**
 * The organisation as a fallback author. This is always truthful: Terravion
 * does publish this material, so an organisational byline claims nothing false.
 */
export const ORGANISATION_AUTHOR: Author = {
  id: "terravion",
  name: site.name,
  role: "Editorial team",
  bio: `${site.name} develops and sells approved plotted communities in Shankarpally, West Hyderabad. This material is written from that transaction experience and reviewed against current Telangana regulation before publication.`,
  credentials: [],
  url: `${site.domain}/about`,
  sameAs: [site.social.instagram, site.social.youtube, site.social.linkedin],
};

/**
 * Named contributors.
 *
 * Every entry below is a PLACEHOLDER and is inert until verified. Replace the
 * name, role, bio and credentials with real facts about a real person who
 * genuinely reviewed the content, then remove `placeholder: true`.
 */
export const AUTHORS: Record<string, Author> = {
  terravion: ORGANISATION_AUTHOR,

  founder: {
    id: "founder",
    name: site.founderName,
    role: "Founder",
    bio: "[Replace with a specific, verifiable account of this person's experience — years in Telangana land transactions, projects delivered, professional background.]",
    credentials: [],
    url: `${site.domain}/founder`,
    placeholder: true,
  },

  "legal-reviewer": {
    id: "legal-reviewer",
    name: "[Reviewing advocate — replace with the real reviewer's name]",
    role: "Property advocate",
    bio: "[Replace with the advocate's real practice details: bar enrolment, years practising property law in Telangana, and what they actually reviewed.]",
    credentials: [],
    placeholder: true,
  },
};

/** True when an author's details are verified and safe to publish as schema. */
export function isPublishable(author: Author | undefined): author is Author {
  if (!author) return false;
  if (author.placeholder) return false;
  // A name still wrapped in brackets is an unreplaced placeholder.
  return !/^\[|\]$/.test(author.name.trim());
}

/**
 * Resolve an author id to a publishable Author, falling back to the
 * organisation. Never returns a placeholder.
 */
export function resolveAuthor(id?: string): Author {
  const candidate = id ? AUTHORS[id] : undefined;
  return isPublishable(candidate) ? candidate : ORGANISATION_AUTHOR;
}

/**
 * Resolve a reviewer. Unlike the author there is no fallback: an unverified
 * reviewer must produce *nothing*, because "reviewed by" is a factual claim
 * about a review that either happened or did not.
 */
export function resolveReviewer(id?: string): Author | null {
  const candidate = id ? AUTHORS[id] : undefined;
  return isPublishable(candidate) ? candidate : null;
}
