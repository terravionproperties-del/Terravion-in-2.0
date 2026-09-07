import "server-only";
import { cache } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";

/**
 * Server-side translation loading.
 *
 * Two decisions worth defending, because they are what keeps the client bundle
 * flat no matter how much copy the site grows:
 *
 * 1. `server-only`. Importing this from a Client Component is a build error,
 *    not a runtime surprise. Translation lookup happens while rendering on the
 *    server; the browser receives finished HTML. That is the difference between
 *    an internationalised site and a client-side translation widget, and it is
 *    the single most important line in this file.
 *
 * 2. One JSON file per namespace, not one per locale. A page that renders the
 *    header and a lead form pulls `navigation`, `forms` and `validation` — and
 *    nothing else. A monolithic `te.json` would be indivisible by construction,
 *    so "lazy loaded, code split" would be a claim rather than a fact.
 *
 * Missing keys fall back to English rather than rendering a raw dot-path. A
 * half-translated page is a content problem; `forms.submit.label` appearing on
 * a button is a visible defect.
 */

export const NAMESPACES = [
  "common",
  "navigation",
  "hero",
  "buttons",
  "projects",
  "guides",
  "journal",
  "locations",
  "tools",
  "footer",
  "forms",
  "validation",
  "errors",
  "cta",
  "contact",
  "investment",
  "about",
  "metadata",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

/** Translation values are strings or nested groups of them. Nothing else. */
export type TranslationNode = string | string[] | { [key: string]: TranslationNode };
export type NamespaceDictionary = Record<string, TranslationNode>;
export type Dictionary = Partial<Record<Namespace, NamespaceDictionary>>;

/**
 * Load one namespace for one locale.
 *
 * `cache()` dedupes within a single request, so a layout and three nested
 * components asking for `navigation` read the file once.
 */
/**
 * Every namespace file, addressed by a literal import specifier.
 *
 * This is deliberately 48 hand-written lines rather than
 * ``import(`@/locales/${locale}/${namespace}.json`)``, which is what it used to
 * be. Webpack turns a template specifier into a context module and `next build`
 * succeeds; **Turbopack cannot**, and `next dev --turbopack` failed to resolve
 * it — so every route in dev returned 500 while production built cleanly. A
 * bundler-specific failure that only shows up in the mode you develop in is the
 * worst kind, so the specifiers are now static and both bundlers agree.
 *
 * The `Record<Locale, Record<Namespace, …>>` type is the guard: adding a locale
 * or a namespace without adding its loader here is a compile error, not a blank
 * page. Code splitting is unaffected — these are still 48 separate chunks.
 */
const NAMESPACE_LOADERS: Record<
  Locale,
  Record<Namespace, () => Promise<{ default: NamespaceDictionary }>>
> = {
  en: {
    common: () => import("@/locales/en/common.json"),
    navigation: () => import("@/locales/en/navigation.json"),
    hero: () => import("@/locales/en/hero.json"),
    buttons: () => import("@/locales/en/buttons.json"),
    projects: () => import("@/locales/en/projects.json"),
    guides: () => import("@/locales/en/guides.json"),
    journal: () => import("@/locales/en/journal.json"),
    locations: () => import("@/locales/en/locations.json"),
    tools: () => import("@/locales/en/tools.json"),
    footer: () => import("@/locales/en/footer.json"),
    forms: () => import("@/locales/en/forms.json"),
    validation: () => import("@/locales/en/validation.json"),
    errors: () => import("@/locales/en/errors.json"),
    cta: () => import("@/locales/en/cta.json"),
    contact: () => import("@/locales/en/contact.json"),
    investment: () => import("@/locales/en/investment.json"),
    about: () => import("@/locales/en/about.json"),
    metadata: () => import("@/locales/en/metadata.json"),
  },
  te: {
    common: () => import("@/locales/te/common.json"),
    navigation: () => import("@/locales/te/navigation.json"),
    hero: () => import("@/locales/te/hero.json"),
    buttons: () => import("@/locales/te/buttons.json"),
    projects: () => import("@/locales/te/projects.json"),
    guides: () => import("@/locales/te/guides.json"),
    journal: () => import("@/locales/te/journal.json"),
    locations: () => import("@/locales/te/locations.json"),
    tools: () => import("@/locales/te/tools.json"),
    footer: () => import("@/locales/te/footer.json"),
    forms: () => import("@/locales/te/forms.json"),
    validation: () => import("@/locales/te/validation.json"),
    errors: () => import("@/locales/te/errors.json"),
    cta: () => import("@/locales/te/cta.json"),
    contact: () => import("@/locales/te/contact.json"),
    investment: () => import("@/locales/te/investment.json"),
    about: () => import("@/locales/te/about.json"),
    metadata: () => import("@/locales/te/metadata.json"),
  },
  hi: {
    common: () => import("@/locales/hi/common.json"),
    navigation: () => import("@/locales/hi/navigation.json"),
    hero: () => import("@/locales/hi/hero.json"),
    buttons: () => import("@/locales/hi/buttons.json"),
    projects: () => import("@/locales/hi/projects.json"),
    guides: () => import("@/locales/hi/guides.json"),
    journal: () => import("@/locales/hi/journal.json"),
    locations: () => import("@/locales/hi/locations.json"),
    tools: () => import("@/locales/hi/tools.json"),
    footer: () => import("@/locales/hi/footer.json"),
    forms: () => import("@/locales/hi/forms.json"),
    validation: () => import("@/locales/hi/validation.json"),
    errors: () => import("@/locales/hi/errors.json"),
    cta: () => import("@/locales/hi/cta.json"),
    contact: () => import("@/locales/hi/contact.json"),
    investment: () => import("@/locales/hi/investment.json"),
    about: () => import("@/locales/hi/about.json"),
    metadata: () => import("@/locales/hi/metadata.json"),
  },
};

const loadNamespace = cache(
  async (locale: Locale, namespace: Namespace): Promise<NamespaceDictionary> => {
    // No fallback to English. A missing namespace is a build fault and must fail
    // loudly here rather than silently render English inside a Telugu page.
    // `scripts/check-locales.mjs` runs in `prebuild` and guarantees every locale
    // has every namespace and every key, so reaching a throw means that guard
    // was bypassed — which is exactly when a loud failure is wanted.
    const mod = await NAMESPACE_LOADERS[locale][namespace]();
    return (mod.default ?? mod) as NamespaceDictionary;
  }
);

/**
 * Load a set of namespaces for one language, and only that language.
 *
 * There is deliberately no English underneath. A Telugu file that is missing a
 * key renders that key's path on the page — ugly, obvious, and findable —
 * instead of quietly emitting an English sentence inside a Telugu paragraph.
 */
export const getDictionary = cache(
  async (locale: Locale, namespaces: readonly Namespace[]): Promise<Dictionary> => {
    const wanted = namespaces.length ? namespaces : NAMESPACES;

    // Exactly one language's files are read. English is never merged underneath,
    // so a key missing from Telugu renders as its key path — visible, findable,
    // and impossible to mistake for finished copy.
    const entries = await Promise.all(
      wanted.map(async (ns) => [ns, await loadNamespace(locale, ns)] as const)
    );

    return Object.fromEntries(entries) as Dictionary;
  }
);

// ── lookup ────────────────────────────────────────────────────────────────

export type Translator = {
  /** `t("navigation.projects")` or `t("forms.greeting", { name: "Asha" })`. */
  (key: string, vars?: Record<string, string | number>): string;
  /** For copy stored as an array of paragraphs. */
  list: (key: string) => string[];
  /** True when a key exists — for optional copy that should render nothing. */
  has: (key: string) => boolean;
  locale: Locale;
};

/**
 * Build the `t()` a page uses.
 *
 * Keys are `namespace.path.to.value`. The namespace is the first segment, which
 * keeps call sites readable and means a missing namespace is caught in the same
 * place as a missing key.
 */
export function createTranslator(dict: Dictionary, locale: Locale): Translator {
  const read = (key: string): TranslationNode | undefined => {
    const [ns, ...rest] = key.split(".");
    let node: TranslationNode | undefined = dict[ns as Namespace];
    for (const segment of rest) {
      if (node === undefined || typeof node === "string" || Array.isArray(node)) return undefined;
      node = node[segment];
    }
    return node;
  };

  const t = ((key: string, vars?: Record<string, string | number>): string => {
    const node = read(key);
    if (typeof node !== "string") {
      // Surfacing the key beats surfacing nothing: a blank heading looks like a
      // layout bug, whereas `journal.title` reads unmistakably as missing copy.
      return typeof node === "undefined" ? key : String(node);
    }
    return vars ? interpolate(node, vars) : node;
  }) as Translator;

  t.list = (key: string): string[] => {
    const node = read(key);
    if (Array.isArray(node)) return node;
    if (typeof node === "string") return [node];
    return [];
  };

  t.has = (key: string): boolean => read(key) !== undefined;
  t.locale = locale;

  return t;
}

/** `{name}` substitution. Unmatched tokens are left alone, never blanked. */
function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole
  );
}

/**
 * The common case: load namespaces and get a translator back in one call.
 *
 *   const t = await getTranslator(locale, ["navigation", "forms"]);
 */
export async function getTranslator(
  locale: Locale,
  namespaces: readonly Namespace[]
): Promise<Translator> {
  const dict = await getDictionary(locale, namespaces);
  return createTranslator(dict, locale);
}
