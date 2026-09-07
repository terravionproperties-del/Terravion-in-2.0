import { Marked, type Tokens } from "marked";
import { DEFAULT_LOCALE, isLocale, localizePath, type Locale } from "@/lib/i18n/config";

/**
 * Build-time markdown → HTML for content collections. Adds slugged ids to
 * h2/h3 so tables of contents and deep links work, and rewrites internal
 * hrefs into the reader's language so a Telugu article never links out of
 * Telugu. External links are emitted exactly as authored.
 */

/**
 * Deterministic short hash, used only as a last-resort slug.
 *
 * FNV-1a: stable across runs and processes, which is the whole requirement —
 * `extractToc` and the heading renderer slug the same text independently, and
 * a TOC link only works if both arrive at the same id.
 */
function fallbackHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/**
 * Heading text → id.
 *
 * The character class is Unicode-aware on purpose. It used to be
 * `[^a-z0-9\s-]`, which deletes every character outside ASCII — and since a
 * Telugu or Hindi heading contains no ASCII letters at all, every heading on
 * every translated page slugged to the empty string. That single regex broke
 * three things at once: `id=""` repeated down the document (invalid HTML,
 * duplicate ids), every table-of-contents link resolving to bare `#`, and
 * React's duplicate-key warning from the TOC list.
 *
 * `\p{L}`, `\p{N}` and `\p{M}` keep letters, digits and combining marks in any
 * script, so Telugu and Devanagari headings now produce real, stable,
 * per-heading ids. Unicode is valid in an HTML `id` and in a URL fragment;
 * browsers percent-encode it on the way out.
 *
 * `\p{M}` is not optional for Indic text. Vowel signs and the virama are
 * combining marks rather than letters, so keeping only `\p{L}` strips them:
 * `శంకర్‌పల్లి` collapses to `శకరపలల`. Unique and stable, but mangled — and
 * these ids surface in shared URLs.
 *
 * ASCII behaviour is unchanged — `\p{L}` matches exactly the a–z that the old
 * class did, and the same punctuation is still stripped — so existing English
 * anchors and any deep links written against them keep working.
 */
export function slugify(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");

  // Headings made entirely of punctuation or emoji would still empty out.
  return cleaned || `s-${fallbackHash(text)}`;
}

/**
 * True for anything that must never gain a locale prefix: absolute URLs,
 * protocol-relative URLs, `mailto:`, `tel:`, `sms:`, and in-page anchors.
 * The scheme test is deliberately generic — matching a literal list of
 * protocols is how `whatsapp:` and `geo:` links end up rewritten to
 * `/te/whatsapp:...`.
 */
function isExternalHref(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//") || href.startsWith("#");
}

/**
 * Rewrite a site-internal href for a language. Root-relative paths only —
 * a relative href (`../guides/x`) is left alone because resolving it needs
 * the current URL, and no content in this repo authors one.
 */
export function localizeHref(href: string, locale: Locale): string {
  const value = href.trim();
  if (!value || isExternalHref(value) || !value.startsWith("/")) return href;

  const match = /^([^?#]*)([?#][\s\S]*)?$/.exec(value);
  if (!match) return href;

  const path = match[1];
  const suffix = match[2] ?? "";

  // Already carries a locale segment (`/te/guides/...`): leave it, otherwise
  // switching languages would produce `/hi/te/guides/...`.
  const first = path.split("/").filter(Boolean)[0];
  if (first && isLocale(first)) return href;

  return `${localizePath(path, locale)}${suffix}`;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * One parser per language. `marked.use()` mutates global state, so a single
 * shared instance would leak whichever locale rendered last into every other
 * page of the same build.
 */
const parsers = new Map<Locale, Marked>();

function parserFor(locale: Locale): Marked {
  const cached = parsers.get(locale);
  if (cached) return cached;

  const instance = new Marked({ gfm: true, breaks: false });
  instance.use({
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const text = this.parser.parseInline(tokens);
        return `<h${depth} id="${slugify(text)}">${text}</h${depth}>\n`;
      },
      link({ href, title, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        const target = localizeHref(href, locale);
        const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
        return `<a href="${escapeAttribute(target)}"${titleAttr}>${text}</a>`;
      },
    },
  });

  parsers.set(locale, instance);
  return instance;
}

/** Full block-level markdown → HTML. */
export function renderMarkdown(md: string, locale: Locale = DEFAULT_LOCALE): string {
  return parserFor(locale).parse(md) as string;
}

/**
 * Inline-only markdown → HTML: links, bold, italic, code, entities — no
 * wrapping `<p>`. Used by renderers that own their own block layout.
 */
export function renderInlineMarkdown(md: string, locale: Locale = DEFAULT_LOCALE): string {
  return parserFor(locale).parseInline(md) as string;
}

/** Extract h2 headings for a table of contents. */
export function extractToc(md: string): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  for (const line of md.split("\n")) {
    const m = /^##\s+(.+)$/.exec(line.trim());
    if (m) {
      const text = m[1].replace(/[*_`]/g, "").trim();
      out.push({ id: slugify(text), text });
    }
  }
  return out;
}

/** Rough reading time from word count. */
export function readingTime(md: string): number {
  return Math.max(1, Math.round(md.split(/\s+/).length / 220));
}
