#!/usr/bin/env node
/**
 * Proves — rather than claims — that a locale's pages contain no English.
 *
 * `check-locales.mjs` verifies the dictionaries agree with each other. It cannot
 * see a string hardcoded in JSX, which is exactly the class of defect that let
 * the navigation translate while the investment thesis stayed English. This
 * script fetches the rendered HTML and reads what a visitor actually sees.
 *
 * Method, and its limits, stated plainly:
 *
 *   · Script tags, style tags and comments are stripped, then all remaining
 *     tags. What is left is visible text.
 *   · Latin-script word runs of 4+ characters count as suspect English.
 *   · An allowlist covers words that are *correctly* Latin in every language:
 *     the brand, statutory acronyms (HMDA, DTCP, ORR, MMTS, RERA), and place
 *     names. Those are not translation failures — a Telugu buyer asks the
 *     Sub-Registrar for "HMDA approval" in those words.
 *
 * It is a lint, not a proof of quality: it cannot tell good Telugu from bad. It
 * can tell Telugu from English, which is the failure being hunted.
 *
 * Exit 1 if any audited route still contains English, so it can gate a release.
 */
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = process.env.AUDIT_BASE_URL ?? process.argv[2] ?? "http://localhost:3000";

/** Latin tokens that are correct in every language. */
const ALLOWED = new Set(
  [
    "terravion", "properties", "hmda", "dtcp", "orr", "rrr", "mmts", "rera", "sro",
    "emi", "roi", "gst", "nri", "bhk", "rcc", "ftl", "hfc", "iit", "hitec",
    "shankarpally", "hyderabad", "telangana", "gachibowli", "kokapet", "tellapur",
    "kollur", "mokila", "narsingi", "chevella", "moinabad", "patancheru", "julkal",
    "neopolis", "kandi", "mominpet", "sanctuary", "raghunath", "county", "mansanpally",
    "whatsapp", "instagram", "youtube", "facebook", "linkedin",
    "html", "json", "http", "https", "www", "com", "svg", "webp", "utf",
    "true", "false", "null", "self", "main", "type",
  ].map((w) => w.toLowerCase())
);

/** The routes the brief names, plus a translated article of each kind. */
const SECTIONS = [
  "",
  "/projects",
  "/locations",
  "/investment",
  "/guides",
  "/blog",
  "/about",
  "/contact",
  "/site-visit",
  "/amenities",
  "/gallery",
  "/testimonials",
  "/founder",
  "/tools/emi-calculator",
  "/tools/roi-calculator",
  "/guides/how-to-buy-villa-plots",
];

const ROUTES = ["te", "hi"].flatMap((locale) =>
  SECTIONS.map((section) => ({ locale, route: `/${locale}${section}` }))
);

/** Visible text only. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** `<title>` and meta description — metadata a visitor reads in a tab or a SERP. */
function metaText(html) {
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
  const desc = html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? "";
  return `${title} ${desc}`;
}

function englishWords(text) {
  const words = text.match(/[A-Za-z][A-Za-z'’-]{3,}/g) ?? [];
  const suspect = words.filter(
    (w) => !ALLOWED.has(w.toLowerCase().replace(/[’']s$/, ""))
  );
  const counts = new Map();
  for (const w of suspect) counts.set(w, (counts.get(w) ?? 0) + 1);
  return {
    total: suspect.length,
    top: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
  };
}

const results = [];
let failures = 0;

for (const { locale, route } of ROUTES) {
  let html;
  let status;
  try {
    const res = await fetch(`${BASE}${route}`, { redirect: "follow" });
    status = res.status;
    html = await res.text();
  } catch (error) {
    results.push({ locale, route, status: 0, error: String(error) });
    failures++;
    continue;
  }

  if (status !== 200) {
    results.push({ locale, route, status, bodyEnglish: -1, metaEnglish: -1, sample: [] });
    failures++;
    continue;
  }

  const body = englishWords(visibleText(html));
  const meta = englishWords(metaText(html));
  if (body.total > 0 || meta.total > 0) failures++;

  results.push({
    locale,
    route,
    status,
    bodyEnglish: body.total,
    metaEnglish: meta.total,
    sample: [...body.top, ...meta.top].slice(0, 8),
  });
}

// ── report ────────────────────────────────────────────────────────────────
const width = Math.max(...results.map((r) => r.route.length)) + 2;
console.log("\n" + "Route".padEnd(width) + "code  body-EN  meta-EN  most frequent");
console.log("-".repeat(width + 50));

for (const r of results) {
  const sample = (r.sample ?? []).map(([w, n]) => `${w}x${n}`).join(" ").slice(0, 46);
  console.log(
    r.route.padEnd(width) +
      String(r.status).padEnd(6) +
      String(r.bodyEnglish ?? "-").padEnd(9) +
      String(r.metaEnglish ?? "-").padEnd(9) +
      sample
  );
}

const totalBody = results.reduce((n, r) => n + Math.max(0, r.bodyEnglish ?? 0), 0);
const totalMeta = results.reduce((n, r) => n + Math.max(0, r.metaEnglish ?? 0), 0);

console.log("\n" + "=".repeat(width + 50));
console.log(`Routes audited:            ${results.length}`);
console.log(`Routes clean:              ${results.length - failures}`);
console.log(`English words in body:     ${totalBody}`);
console.log(`English words in metadata: ${totalMeta}`);
console.log(`Failing routes:            ${failures}`);

mkdirSync("reports", { recursive: true });
writeFileSync("reports/i18n-audit.json", JSON.stringify({ base: BASE, results }, null, 2));
console.log("\nreports/i18n-audit.json written");

process.exit(failures > 0 ? 1 : 0);
