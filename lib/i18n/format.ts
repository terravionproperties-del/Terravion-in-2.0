import { LOCALE_META, type Locale } from "./config";
import type { Translator } from "./dictionaries";

/**
 * Locale-aware numbers, money, dates and units.
 *
 * The division of labour here is deliberate, because getting it wrong is the
 * usual way a multilingual site ends up with half-translated measurements:
 *
 *   · `Intl` handles anything that is a *rule* — digit grouping, month names,
 *     currency placement. Those are properties of the language, and the platform
 *     already knows them better than a lookup table would.
 *   · The JSON dictionaries handle anything that is a *word* — "Sq Ft", "acres",
 *     "lakh". Those are copy, and copy belongs with the rest of the copy where a
 *     translator can see it in context.
 *
 * So `formatArea` takes a translator: the number comes from Intl, the unit comes
 * from `common.units.*`, and neither half is hardcoded in the other's file.
 *
 * A note on digits. `Intl.NumberFormat("te-IN")` renders Latin numerals with
 * Indian grouping (1,25,000) rather than Telugu-script digits, and that is
 * correct — Telugu and Hindi readers in India read prices in Latin numerals.
 * Forcing `-u-nu-telu` would produce ౧,౨౫,౦౦౦, which is technically Telugu and
 * practically unreadable to the buyer this site is for. It also matches the
 * brief's own examples, which keep "1,250" Latin in all three languages.
 */

const numberCache = new Map<string, Intl.NumberFormat>();
const dateCache = new Map<string, Intl.DateTimeFormat>();

function numberFormatter(locale: Locale, options: Intl.NumberFormatOptions = {}) {
  const key = `${locale}:${JSON.stringify(options)}`;
  let f = numberCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE_META[locale].bcp47, options);
    numberCache.set(key, f);
  }
  return f;
}

function dateFormatter(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}:${JSON.stringify(options)}`;
  let f = dateCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE_META[locale].bcp47, options);
    dateCache.set(key, f);
  }
  return f;
}

/** `1250` → `1,250`; `125000` → `1,25,000` (Indian grouping in all three). */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return numberFormatter(locale, options).format(value);
}

/**
 * Rupees, with the symbol placed by the locale rather than concatenated.
 *
 * `maximumFractionDigits: 0` because land is never quoted to the paisa and
 * `₹42,00,000.00` reads like a bank statement rather than a price.
 */
export function formatCurrency(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {}
): string {
  return numberFormatter(locale, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

/**
 * Indian price shorthand: 4200000 → "₹42 L", 42000000 → "₹4.2 Cr".
 *
 * Lakh and crore are units, not number formats, so their labels come from the
 * dictionary. Intl has no concept of either.
 */
export function formatCompactCurrency(value: number, locale: Locale, t: Translator): string {
  const symbol = "₹";
  if (value >= 10_000_000) {
    const cr = value / 10_000_000;
    return `${symbol}${formatNumber(round(cr), locale)} ${t("common.units.crore")}`;
  }
  if (value >= 100_000) {
    const lakh = value / 100_000;
    return `${symbol}${formatNumber(round(lakh), locale)} ${t("common.units.lakh")}`;
  }
  return formatCurrency(value, locale);
}

/** One decimal, but only where it carries information: 4.0 → 4, 4.25 → 4.3. */
function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * `1250, "sqft"` → `1,250 Sq Ft` / `1,250 చదరపు అడుగులు` / `1,250 वर्ग फुट`.
 *
 * The gap between number and unit is a plain space rather than a non-breaking
 * one on purpose: the Telugu and Hindi unit names are long enough that
 * forbidding a line break there overflows narrow table cells, which is a worse
 * failure than a wrapped unit.
 */
export function formatArea(
  value: number,
  unit: "sqft" | "sqyd" | "acre" | "guntha",
  locale: Locale,
  t: Translator
): string {
  return `${formatNumber(value, locale)} ${t(`common.units.${unit}`)}`;
}

/** Long form: 9 August 2026 / 9 ఆగస్టు 2026 / 9 अगस्त 2026. */
export function formatDate(iso: string, locale: Locale): string {
  return dateFormatter(locale, { day: "numeric", month: "long", year: "numeric" }).format(
    parseIsoDate(iso)
  );
}

/** Short form for card metadata: Aug 2026 / ఆగ 2026 / अग 2026. */
export function formatMonthYear(iso: string, locale: Locale): string {
  return dateFormatter(locale, { month: "short", year: "numeric" }).format(parseIsoDate(iso));
}

/**
 * `YYYY-MM-DD` with an explicit midnight.
 *
 * Without the `T00:00:00` the string is parsed as UTC and rendered in local
 * time, which silently shows the previous day for anyone west of Greenwich. The
 * existing pages already do this by hand at three call sites; centralising it
 * means the next date added to the site cannot forget.
 */
function parseIsoDate(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
}

/** "8 min read", with the noun supplied by the dictionary. */
export function formatReadingTime(minutes: number, locale: Locale, t: Translator): string {
  return t("common.readingTime", { minutes: formatNumber(minutes, locale) });
}

/**
 * A list joined the way the language joins things: "A, B and C" in English, and
 * whatever the equivalent is elsewhere. `Intl.ListFormat` knows; we do not.
 */
export function formatList(items: string[], locale: Locale): string {
  if (items.length === 0) return "";
  return new Intl.ListFormat(LOCALE_META[locale].bcp47, {
    style: "long",
    type: "conjunction",
  }).format(items);
}
