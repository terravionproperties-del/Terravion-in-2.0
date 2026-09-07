#!/usr/bin/env node
/**
 * Verifies the translation files against English.
 *
 * Three failure modes this catches, all of which ship silently otherwise:
 *
 *   · a key present in English and missing in Telugu — the page renders an
 *     English string in the middle of a Telugu paragraph, which reads as broken
 *     to a visitor and is completely invisible to `tsc` and to `next build`;
 *   · a key present in Telugu and absent from English — dead copy no call site
 *     reads, usually left behind by a rename;
 *   · a value identical to its English original. Some of those are correct
 *     ("Terravion", "HMDA", "EMI"), so this is reported as a warning with the
 *     value attached rather than as a failure — a human decides.
 *
 * Exit 0 clean, 1 on any structural mismatch. Wired into `prebuild`, so a
 * missing translation cannot reach a production build unnoticed.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = "locales";
const BASE = "en";

/** Values that are legitimately identical across languages. */
const ALLOW_IDENTICAL = new Set([
  "Terravion",
  "EMI",
  "ROI",
  "HMDA",
  "DTCP",
  "ORR",
  "HMDA + DTCP",
  "ORR Exit 3",
  "404",
  "name",
  "tel",
  "email",
  "you@example.com",
  "+91 …",
  // Roman numerals are numerals, not words.
  "I.",
  "II.",
  "III.",
  "IV.",
  "V.",
]);

function flatten(node, prefix = "", out = new Map()) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, path, out);
    } else {
      out.set(path, Array.isArray(value) ? value.join(" | ") : String(value));
    }
  }
  return out;
}

function read(locale, file) {
  const path = join(ROOT, locale, file);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

const locales = readdirSync(ROOT).filter((d) => d !== BASE);
const files = readdirSync(join(ROOT, BASE)).filter((f) => f.endsWith(".json"));

let failures = 0;
let identical = 0;
let checked = 0;

for (const locale of locales) {
  for (const file of files) {
    const base = flatten(read(BASE, file));
    const target = read(locale, file);

    if (!target) {
      console.error(`FAIL  ${locale}/${file} — file missing`);
      failures++;
      continue;
    }

    const flat = flatten(target);
    checked += base.size;

    for (const key of base.keys()) {
      if (!flat.has(key)) {
        console.error(`FAIL  ${locale}/${file} — missing key: ${key}`);
        failures++;
      }
    }
    for (const key of flat.keys()) {
      if (!base.has(key)) {
        console.error(`FAIL  ${locale}/${file} — key not in ${BASE}: ${key}`);
        failures++;
      }
    }
    for (const [key, value] of flat) {
      if (value !== "" && base.get(key) === value && !ALLOW_IDENTICAL.has(value)) {
        console.warn(`warn  ${locale}/${file} — untranslated: ${key} = "${value}"`);
        identical++;
      }
    }
  }
}

console.log(
  `\n${locales.length} locales x ${files.length} namespaces — ${checked} keys checked, ` +
    `${failures} failures, ${identical} untranslated`
);

process.exit(failures > 0 ? 1 : 0);
