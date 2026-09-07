/**
 * The answer-first block that sits above the article body.
 *
 * Two jobs, one visible and one machine-facing.
 *
 * For the reader: a plot buyer arriving from a search for "is Shankarpally on
 * MMTS" wants the answer in the first screen, not after eight hundred words of
 * throat-clearing. The summary gives it, and the article underneath earns the
 * rest of their attention rather than assuming it.
 *
 * For AI search: engines that cite sources extract a short, self-contained
 * answer near the top of the document. An article whose first extractable
 * sentence is "Hyderabad's western corridor has changed considerably" gives an
 * engine nothing to quote; one that opens with a direct claim gets cited.
 *
 * The `article-intro` class is load-bearing. `articleSchema()` declares
 * `speakable: { cssSelector: ["h1", ".article-intro"] }`, and until this
 * component existed that selector matched no element on any page — the
 * speakable declaration pointed at nothing, so voice assistants had no passage
 * to read aloud. This is that element.
 *
 * Nothing here is generated. The summary is the article's own hand-written
 * excerpt, and `takeaways` renders only when an editor has written them, so an
 * article without takeaways shows none rather than inventing any.
 */

export interface ArticleSummaryProps {
  /** The article's own excerpt — hand-written, never generated. */
  summary: string;
  /** Optional editor-written key points. Omit rather than invent. */
  takeaways?: readonly string[];
  /** Localised heading, e.g. "In short" / "సారాంశం" / "सारांश". */
  summaryLabel: string;
  /** Localised heading for the takeaway list. */
  takeawaysLabel?: string;
  /** Language of the prose, when it differs from the page (untranslated body). */
  lang?: string;
}

export default function ArticleSummary({
  summary,
  takeaways,
  summaryLabel,
  takeawaysLabel,
  lang,
}: ArticleSummaryProps) {
  return (
    <aside
      aria-label={summaryLabel}
      lang={lang}
      className="mb-14 rounded-2xl border border-gold/20 bg-sand/25 p-7 md:p-8"
    >
      <p className="label text-gold-ink">{summaryLabel}</p>

      {/*
        `.article-intro` is referenced by the speakable schema. Renaming it
        silently breaks voice extraction, which nothing in the build would
        catch — so it is named here and in lib/schema.ts and nowhere else.
      */}
      <p className="article-intro mt-4 text-lg leading-relaxed text-charcoal">
        {summary}
      </p>

      {takeaways && takeaways.length > 0 && (
        <div className="mt-7 border-t border-gold/15 pt-6">
          {takeawaysLabel && (
            <p className="label text-stone-grey">{takeawaysLabel}</p>
          )}
          <ul className="mt-4 space-y-3">
            {takeaways.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-[0.95rem] leading-relaxed text-text-secondary"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
