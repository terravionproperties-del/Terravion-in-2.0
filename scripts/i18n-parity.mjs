#!/usr/bin/env node
/**
 * Asserts that every locale presents the same site.
 *
 * The failure this exists to catch: filtering a collection by translation
 * availability, which made `/te/blog` render zero cards and `/te/guides` render
 * one while English had 72 and 12. Changing language changed the information
 * architecture. Card counts must be identical across locales — only the words
 * inside them may differ.
 *
 * It also checks redirect behaviour, because the same release fixed a loop:
 * middleware used to redirect unprefixed paths to the cookie's locale, which
 * raced the cookie write and bounced the router. Every listing URL must resolve
 * in at most one hop.
 *
 * Exit 1 on any mismatch.
 */
const BASE = process.env.AUDIT_BASE_URL ?? process.argv[2] ?? "http://localhost:3000";

const LOCALES = ["en", "te", "hi"];
const SECTIONS = [
  { name: "guides", list: "/guides", item: "/guides/" },
  { name: "journal", list: "/blog", item: "/blog/" },
  { name: "locations", list: "/locations", item: "/locations/" },
  { name: "projects", list: "/projects", item: "/projects/" },
];

const prefix = (locale) => (locale === "en" ? "" : `/${locale}`);

/**
 * Unique article links on a listing page.
 *
 * Either form counts. A card whose translation is missing points at the English
 * URL by design — it is still a card, still visible, still the same slot in the
 * grid, which is exactly what parity means here.
 */
function countCards(html, itemPath) {
  // Only the main content area. The header's mega menu links to three projects
  // and one featured essay on every page; counting those made /te/projects read
  // 6 against English's 3 — an artefact of the counter, not of the page.
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? html;
  const escaped = itemPath.replace(/\//g, "\\/");
  const re = new RegExp(`href="(?:\\/(?:te|hi))?${escaped}[a-z0-9-]+"`, "g");
  return new Set(main.match(re) ?? []).size;
}

let failures = 0;
const table = [];

for (const section of SECTIONS) {
  const row = { section: section.name, counts: {}, hops: {} };

  for (const locale of LOCALES) {
    const url = `${BASE}${prefix(locale)}${section.list}`;

    // Walk redirects manually so a loop shows as a chain rather than hanging.
    let hops = 0;
    let current = url;
    let status = 0;
    for (let i = 0; i < 5; i++) {
      const res = await fetch(current, { redirect: "manual" });
      status = res.status;
      if (status >= 300 && status < 400) {
        hops++;
        const next = res.headers.get("location");
        if (!next) break;
        current = next.startsWith("http") ? next : `${BASE}${next}`;
        continue;
      }
      break;
    }

    const html = await fetch(current).then((r) => r.text());
    row.counts[locale] = countCards(html, section.item);
    row.hops[locale] = hops;

    if (status !== 200) {
      console.error(`FAIL  ${url} — HTTP ${status}`);
      failures++;
    }
    if (hops > 1) {
      console.error(`FAIL  ${url} — ${hops} redirect hops (loop risk)`);
      failures++;
    }
    if (row.counts[locale] === 0) {
      console.error(`FAIL  ${url} — listing page is empty`);
      failures++;
    }
  }

  const values = LOCALES.map((l) => row.counts[l]);
  if (new Set(values).size !== 1) {
    console.error(
      `FAIL  ${section.name} — card counts differ: ` +
        LOCALES.map((l) => `${l}=${row.counts[l]}`).join(" ")
    );
    failures++;
  }

  table.push(row);
}

console.log("\nSection      " + LOCALES.map((l) => l.padEnd(8)).join("") + "hops");
console.log("-".repeat(50));
for (const row of table) {
  console.log(
    row.section.padEnd(13) +
      LOCALES.map((l) => String(row.counts[l]).padEnd(8)).join("") +
      LOCALES.map((l) => row.hops[l]).join("/")
  );
}

console.log("\n" + "=".repeat(50));
console.log(`Sections checked: ${SECTIONS.length}`);
console.log(`Parity failures:  ${failures}`);

process.exit(failures > 0 ? 1 : 0);
