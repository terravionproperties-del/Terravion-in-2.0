/**
 * Measurement IDs, consent plumbing, and the small typed surface every
 * analytics call site is allowed to touch.
 *
 * Three rules, all of them consequences of shipping this to production:
 *
 * 1. **Nothing is required.** Every ID is optional. An unset variable disables
 *    exactly one vendor and disables nothing else. There is no code path here
 *    that can throw, so a missing Clarity ID cannot take down a page.
 *
 * 2. **No ID is ever written down.** They are read from `process.env` and only
 *    from `process.env`. A hardcoded `G-…` would follow a fork of this repo
 *    into someone else's property, and their traffic into this account.
 *
 * 3. **Consent is denied until a visitor says otherwise.** India's DPDP Act
 *    2023 treats analytics and advertising storage as non-essential
 *    processing, so Google Consent Mode v2 boots with `analytics_storage` and
 *    all three ad signals denied. `<ConsentBanner />` is the only thing that
 *    can move them, and it persists the answer so it is asked once.
 *
 * ### Why this reads `process.env` directly rather than going through lib/env.ts
 *
 * `lib/env.ts` inspects the whole `process.env` object at runtime, on the
 * server, and validates it with Zod. That is the right tool for a boot-time
 * diagnosis and the wrong one for a Client Component: the browser has no
 * `process.env` to walk. Next.js only inlines `process.env.NEXT_PUBLIC_*` when
 * it can see the full property access written out literally, which is why the
 * three public IDs below are spelled in full rather than looked up by key.
 *
 * The variables are *also* registered in `lib/env.ts` so that a malformed
 * measurement ID is reported at boot alongside every other subsystem. That is
 * a second reader of the same variable, not a second source of truth.
 */

/** Treat an unset variable and an empty one as the same thing: not configured. */
function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// ── Public IDs · inlined into the client bundle at build time ───────────────

/** GA4 measurement ID, e.g. `G-XXXXXXXXXX`. */
export const GA_MEASUREMENT_ID = clean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

/** Google Tag Manager container ID, e.g. `GTM-XXXXXXX`. */
export const GTM_ID = clean(process.env.NEXT_PUBLIC_GTM_ID);

/** Microsoft Clarity project ID, e.g. `abcdefghij`. */
export const CLARITY_ID = clean(process.env.NEXT_PUBLIC_CLARITY_ID);

// ── Verification tokens · server-only ──────────────────────────────────────
//
// No NEXT_PUBLIC_ prefix, so these resolve to `undefined` in the browser
// bundle rather than leaking. They are read from `generateMetadata`, which
// runs on the server, and nowhere else. Nothing secret is at stake either way
// — a verification token ends up in a public <meta> tag — but the boundary is
// worth keeping honest.

/** Google Search Console `google-site-verification` token. */
export const GOOGLE_SITE_VERIFICATION = clean(process.env.GOOGLE_SITE_VERIFICATION);

/** Bing Webmaster Tools `msvalidate.01` token. */
export const BING_SITE_VERIFICATION = clean(process.env.BING_SITE_VERIFICATION);

// ── Feature predicates ─────────────────────────────────────────────────────

/** Is GA4 configured? */
export function isGaEnabled(): boolean {
  return GA_MEASUREMENT_ID !== undefined;
}

/** Is Google Tag Manager configured? */
export function isGtmEnabled(): boolean {
  return GTM_ID !== undefined;
}

/** Is Microsoft Clarity configured? */
export function isClarityEnabled(): boolean {
  return CLARITY_ID !== undefined;
}

/**
 * Is any measurement vendor configured at all?
 *
 * This is what decides whether the consent banner appears. Asking a visitor to
 * consent to tracking that does not exist would be theatre, and an interruption
 * for nothing.
 */
export function isAnalyticsEnabled(): boolean {
  return isGaEnabled() || isGtmEnabled() || isClarityEnabled();
}

/** True when at least one vendor sets cookies or storage that needs consent. */
export function needsConsent(): boolean {
  return isAnalyticsEnabled();
}

// ── Consent ────────────────────────────────────────────────────────────────

export type ConsentChoice = "granted" | "denied";

/**
 * localStorage key holding the visitor's answer.
 *
 * Storing the decision itself is "strictly necessary" processing under any
 * reading of the DPDP Act — it exists to honour a preference, not to profile —
 * so it is written whichever way the visitor answers.
 */
export const CONSENT_STORAGE_KEY = "tv:analytics-consent";

/** Same-tab notification that the choice changed, so `<Analytics />` re-renders. */
export const CONSENT_EVENT = "tv:consent-change";

/** The inline bootstrap reads this key; keep the two spellings in step. */
export type ConsentState = ConsentChoice | null;

/**
 * Read the stored choice. `null` means "not yet asked", which is not the same
 * as "declined" — one shows the banner, the other does not.
 */
export function readStoredConsent(): ConsentState {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Private browsing, or storage disabled by policy. Treat it as unanswered
    // rather than throwing inside a render.
    return null;
  }
}

/**
 * Persist the choice, tell Google about it, and tell this tab.
 *
 * Consent Mode v2 signals, all four of them. `functionality_storage` and
 * `security_storage` are never touched: they cover the site working and the
 * site not being abused, which is not what a consent banner is asking about.
 */
export function writeConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Unable to remember the answer. The banner will ask again next visit,
    // which is the safe failure: it never silently upgrades to granted.
  }

  window.gtag?.("consent", "update", {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
  });

  // Clarity records session replays, so it is only ever loaded after a grant;
  // this call covers the case where its script is already on the page.
  window.clarity?.("consent", choice === "granted");

  window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_EVENT, { detail: choice }));
}

/**
 * Send a GA4 event, if GA is configured and loaded.
 *
 * Deliberately forgiving: no GA, no `gtag`, or a visitor who declined all
 * produce a silent no-op rather than an exception on the revenue path.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !isGaEnabled()) return;
  window.gtag?.("event", name, params);
}

// ── Ambient types ──────────────────────────────────────────────────────────
//
// Written out rather than pulled from @types/gtag.js so the dependency list
// does not grow for five lines of types.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}
