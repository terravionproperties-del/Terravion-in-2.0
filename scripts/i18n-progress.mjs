#!/usr/bin/env node
/**
 * The translation work queue.
 *
 * Prints what is done, what is next, and in what order — so a session can pick
 * up mid-project without re-reading the tree or repeating finished files. Run it
 * first, translate the files it names, run it again.
 *
 * Order is fixed: guides, then locations, then blog. Within each kind, shortest
 * first — that is what gets a listing page to full parity soonest, because the
 * "English only" badge disappears per file and `/te/guides` reaches 12/12 long
 * before the journal has moved at all.
 *
 *   node scripts/i18n-progress.mjs           # full status
 *   node scripts/i18n-progress.mjs --next 4  # just the next four files
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const KINDS = ["guides", "locations", "blog"];
const LOCALES = ["te", "hi"];

const nextCount = process.argv.includes("--next")
  ? Number(process.argv[process.argv.indexOf("--next") + 1]) || 4
  : 0;

/** Word count of the English body, used to order shortest-first. */
function bodyWords(kind, slug) {
  const src = readFileSync(join(root, "content", kind, `${slug}.ts`), "utf8");
  // The key that follows `body` differs per content type — faqs, updated,
  // published, readingMinutes, distanceFrom — so naming them undercounted every
  // blog post to zero and made the remaining-words total look a third of its
  // real size. Match the closing backtick-comma instead.
  const m = src.match(/body:\s*`([\s\S]*?)`,\n/);
  return m ? m[1].trim().split(/\s+/).length : 0;
}

const rows = [];
const totals = { done: 0, todo: 0, words: 0 };

for (const kind of KINDS) {
  const dir = join(root, "content", kind);
  if (!existsSync(dir)) continue;

  const slugs = readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    .map((f) => f.replace(/\.ts$/, ""));

  for (const slug of slugs) {
    const have = LOCALES.filter((l) =>
      existsSync(join(root, "content/i18n", l, kind, `${slug}.ts`))
    );
    const missing = LOCALES.filter((l) => !have.includes(l));
    const words = bodyWords(kind, slug);

    if (missing.length === 0) totals.done++;
    else {
      totals.todo++;
      totals.words += words * missing.length;
    }
    rows.push({ kind, slug, have, missing, words });
  }
}

const queue = rows
  .filter((r) => r.missing.length > 0)
  .sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || a.words - b.words);

if (nextCount) {
  for (const r of queue.slice(0, nextCount)) {
    console.log(`${r.kind}/${r.slug}  ->  ${r.missing.join(",")}  (${r.words} words)`);
  }
  process.exit(0);
}

console.log("\nTranslation status\n" + "=".repeat(58));
for (const kind of KINDS) {
  const of = rows.filter((r) => r.kind === kind);
  const complete = of.filter((r) => r.missing.length === 0).length;
  const partial = of.filter((r) => r.have.length > 0 && r.missing.length > 0).length;
  console.log(
    `  ${kind.padEnd(11)} ${String(complete).padStart(3)}/${String(of.length).padEnd(4)} complete` +
      (partial ? `   ${partial} partial` : "")
  );
}

console.log("\nNext up (guides -> locations -> blog, shortest first)\n" + "-".repeat(58));
for (const r of queue.slice(0, 12)) {
  console.log(
    `  ${(r.kind + "/" + r.slug).padEnd(44)} ${r.missing.join(",").padEnd(6)} ${r.words}w`
  );
}
if (queue.length > 12) console.log(`  ... and ${queue.length - 12} more`);

console.log("\n" + "=".repeat(58));
console.log(`  files complete:   ${totals.done}`);
console.log(`  files remaining:  ${totals.todo}`);
console.log(`  words remaining:  ~${totals.words.toLocaleString("en-IN")}`);
console.log(`\n  after each file:  node scripts/gen-translation-index.mjs && npm run build\n`);
