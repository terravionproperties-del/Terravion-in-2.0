import "server-only";
import type { Locale } from "@/lib/i18n/config";

/**
 * Legal copy sits outside the dictionary system on purpose: its shape (an
 * ordered array of {heading, paragraphs} sections) is richer than
 * TranslationNode allows, and the two legal pages are the only consumers.
 * Static specifiers, same as NAMESPACE_LOADERS, so Turbopack can resolve them.
 */
export interface LegalSection {
  h: string;
  body: string[];
}

export interface LegalDoc {
  title: string;
  updatedLabel: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export interface LegalContent {
  privacy: LegalDoc;
  terms: LegalDoc;
}

const LOADERS: Record<Locale, () => Promise<{ default: LegalContent }>> = {
  en: () => import("@/locales/en/legal.json"),
  te: () => import("@/locales/te/legal.json"),
  hi: () => import("@/locales/hi/legal.json"),
};

export async function loadLegal(locale: Locale): Promise<LegalContent> {
  try {
    return (await LOADERS[locale]()).default;
  } catch {
    return (await LOADERS.en()).default;
  }
}
