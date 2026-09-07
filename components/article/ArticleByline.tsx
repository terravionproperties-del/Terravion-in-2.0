import { resolveAuthor, resolveReviewer } from "@/lib/authors";

/**
 * The visible half of E-E-A-T.
 *
 * Structured data alone does not satisfy the quality guidelines, and it does
 * not satisfy readers either. Google's own guidance is explicit that authorship
 * signals should be visible on the page — a `Person` node in JSON-LD that
 * corresponds to nothing a human can see reads as decoration, and the raters
 * who calibrate the ranking systems are looking at the rendered page.
 *
 * It matters more here than on most sites. These articles tell people how to
 * verify a title chain and when to walk away from a plot. "Who is telling me
 * this, what do they know, and when did they last check?" is a reasonable
 * question, and a page that answers it is more trustworthy than one that does
 * not — independently of what any search engine thinks.
 *
 * Honesty is enforced upstream, not here: `resolveAuthor` never returns an
 * unverified person (it falls back to the organisation) and `resolveReviewer`
 * returns null unless a real reviewer is registered. So this component cannot
 * render a fabricated credential — the worst it can do is show the publisher,
 * which is true.
 */

export interface ArticleBylineProps {
  authorId?: string;
  reviewerId?: string;
  /** Localised "Written by". */
  writtenByLabel: string;
  /** Localised "Reviewed by". */
  reviewedByLabel: string;
  /** Pre-formatted, already-localised date string. */
  updatedLabel: string;
}

export default function ArticleByline({
  authorId,
  reviewerId,
  writtenByLabel,
  reviewedByLabel,
  updatedLabel,
}: ArticleBylineProps) {
  const author = resolveAuthor(authorId);
  const reviewer = resolveReviewer(reviewerId);

  return (
    <div className="mt-10 rounded-2xl border border-gold/15 bg-white/60 p-6">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-grey">
          {writtenByLabel}
        </span>
        <span className="text-sm font-semibold text-charcoal">
          {author.url ? (
            <a href={author.url} className="hover:text-gold-ink hover:underline">
              {author.name}
            </a>
          ) : (
            author.name
          )}
        </span>
        <span className="text-xs text-stone-grey">· {author.role}</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {author.bio}
      </p>

      {author.credentials.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {author.credentials.map((c) => (
            <li
              key={c}
              className="rounded-full border border-gold/25 bg-sand/30 px-3 py-1 text-[0.7rem] font-semibold text-gold-ink"
            >
              {c}
            </li>
          ))}
        </ul>
      )}

      {/* Only rendered when a real reviewer exists — see lib/authors.ts. */}
      {reviewer && (
        <div className="mt-5 border-t border-gold/15 pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-grey">
              {reviewedByLabel}
            </span>
            <span className="text-sm font-semibold text-charcoal">
              {reviewer.name}
            </span>
            <span className="text-xs text-stone-grey">· {reviewer.role}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {reviewer.bio}
          </p>
        </div>
      )}

      <p className="mt-5 border-t border-gold/15 pt-4 font-mono text-[0.7rem] text-stone-grey/80">
        {updatedLabel}
      </p>
    </div>
  );
}
