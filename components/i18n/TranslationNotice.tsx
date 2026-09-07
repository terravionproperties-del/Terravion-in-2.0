import Link from "next/link";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n/config";

/**
 * Shown above an article whose body has not been translated yet.
 *
 * The brief asks for no mixed-language UI, and this component is how that is
 * honoured rather than faked. There are 222,396 words of article prose on this
 * site; translating all of it is a content programme, not a build step. Until a
 * given essay is done, a Telugu reader who opens it gets English body copy — and
 * the only dishonest option is to say nothing about it.
 *
 * So the page states the situation in the reader's own language and offers the
 * English URL explicitly. The machinery elsewhere keeps that honest to crawlers
 * too: `availableLocalesFor()` withholds the hreflang and the sitemap entry
 * until the body genuinely exists, so Google is never told a translation is
 * there when it is not.
 */
export default function TranslationNotice({
  locale,
  path,
  title,
  body,
  readInEnglish,
}: {
  locale: Locale;
  /** Canonical, unprefixed path of the article. */
  path: string;
  title: string;
  body: string;
  readInEnglish: string;
}) {
  if (locale === DEFAULT_LOCALE) return null;

  return (
    <aside
      className="mb-10 rounded-2xl p-6 md:p-7"
      style={{ background: "#F1EBE2", border: "1px solid rgba(184,138,68,.22)" }}
    >
      <p
        className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em]"
        style={{ color: "#8A6736" }}
      >
        {title}
      </p>
      <p className="mt-3 text-[1rem] leading-[1.7]" style={{ color: "#595959" }}>
        {body}
      </p>
      <Link
        href={localizePath(path, DEFAULT_LOCALE)}
        hrefLang="en-IN"
        className="mt-4 inline-flex items-center gap-2 text-[0.875rem] font-semibold uppercase tracking-[0.16em] transition-colors"
        style={{ color: "#B88A44" }}
      >
        {readInEnglish}
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </aside>
  );
}
