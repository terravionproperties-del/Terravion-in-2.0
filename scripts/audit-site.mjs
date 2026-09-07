/**
 * Production audit.
 *
 *   node scripts/audit-site.mjs [baseUrl]
 *
 * Crawls every route in the sitemap plus everything they link to, and reports:
 *   · non-200 responses and 404s
 *   · dead internal links (with the pages that point at them)
 *   · missing assets referenced by src/href/url()
 *   · pages with no <h1>, duplicate <h1>, or an empty <title>
 *   · images without alt text
 *
 * Exits non-zero if anything is broken, so CI can gate on it.
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const status = new Map(); // url -> status code
const linkedFrom = new Map(); // url -> Set(pages)
const issues = { broken: [], noH1: [], multiH1: [], noTitle: [], noAlt: [], assets: [] };

async function head(url) {
  if (status.has(url)) return status.get(url);
  let code = 0;
  try {
    const r = await fetch(url, { redirect: "follow" });
    code = r.status;
  } catch {
    code = 0;
  }
  status.set(url, code);
  return code;
}

function note(map, key, value) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(value);
}

async function sitemapUrls() {
  const r = await fetch(`${base}/sitemap.xml`);
  const xml = await r.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1].replace(/^https?:\/\/[^/]+/, base)
  );
}

async function auditPage(url) {
  let html;
  try {
    const r = await fetch(url);
    status.set(url, r.status);
    if (r.status !== 200) {
      issues.broken.push({ url, code: r.status, from: [...(linkedFrom.get(url) ?? [])] });
      return [];
    }
    // Only HTML documents get the structure checks — a manifest or a JS chunk
    // legitimately has no <h1>, and flagging them is noise.
    if (!(r.headers.get("content-type") ?? "").includes("text/html")) return [];
    html = await r.text();
  } catch (e) {
    issues.broken.push({ url, code: `fetch failed: ${e.message}`, from: [] });
    return [];
  }

  // structure checks
  const h1s = [...html.matchAll(/<h1[\s>]/g)].length;
  if (h1s === 0) issues.noH1.push(url);
  if (h1s > 1) issues.multiH1.push({ url, count: h1s });
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
  if (!title.trim()) issues.noTitle.push(url);

  // images without alt (ignore aria-hidden decorative ones)
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\balt=/.test(tag) && !/aria-hidden="true"/.test(tag)) {
      issues.noAlt.push({ url, tag: tag.slice(0, 110) });
    }
  }

  // referenced assets that must exist
  const assets = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/[^"]+\.(?:webp|avif|png|jpe?g|svg|woff2?|ico|txt|xml))"/g))
    assets.add(m[1]);
  for (const m of html.matchAll(/url\((?:&quot;|["']?)(\/[^)"']+\.(?:webp|avif|png|jpe?g|svg))/g))
    assets.add(m[1]);
  for (const a of assets) {
    const code = await head(base + a);
    if (code !== 200) issues.assets.push({ url, asset: a, code });
  }

  // internal links to follow
  const links = new Set();
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    let href = m[1].replace(/\/$/, "") || "/";
    if (/\.(webp|avif|png|jpe?g|svg|xml|txt|ico|woff2?)$/.test(href)) continue;
    links.add(base + href);
  }
  for (const l of links) note(linkedFrom, l, url);
  return [...links];
}

const pages = await sitemapUrls();
console.log(`sitemap routes: ${pages.length}`);

const queue = [...pages];
const seen = new Set(queue);
let done = 0;

while (queue.length) {
  const batch = queue.splice(0, 8);
  const found = await Promise.all(batch.map(auditPage));
  done += batch.length;
  if (done % 40 < 8) console.log(`  audited ${done}…`);
  for (const list of found) {
    for (const l of list) {
      if (!seen.has(l)) {
        seen.add(l);
        queue.push(l);
      }
    }
  }
}

// ── report ───────────────────────────────────────────────────────────
const line = "─".repeat(64);
console.log(`\n${line}\nAUDIT — ${seen.size} unique routes reached\n${line}`);

const report = (label, arr, fmt) => {
  console.log(`\n${label}: ${arr.length}`);
  arr.slice(0, 25).forEach((x) => console.log("  " + fmt(x)));
  if (arr.length > 25) console.log(`  …and ${arr.length - 25} more`);
};

report("BROKEN ROUTES", issues.broken, (b) =>
  `${b.code}  ${b.url}${b.from.length ? `  ← linked from ${b.from[0]}` : ""}`
);
report("MISSING ASSETS", issues.assets, (a) => `${a.code}  ${a.asset}  on ${a.url}`);
report("PAGES WITHOUT H1", issues.noH1, (u) => u);
report("PAGES WITH MULTIPLE H1", issues.multiH1, (m) => `${m.count}× ${m.url}`);
report("PAGES WITHOUT TITLE", issues.noTitle, (u) => u);
report("IMAGES WITHOUT ALT", issues.noAlt, (n) => `${n.url}  ${n.tag}`);

const fatal =
  issues.broken.length + issues.assets.length + issues.noTitle.length + issues.noAlt.length;
console.log(`\n${line}\n${fatal === 0 ? "PASS — no fatal issues" : `FAIL — ${fatal} fatal issue(s)`}\n${line}`);
process.exit(fatal === 0 ? 0 : 1);
