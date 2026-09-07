import Image from "next/image";
import Link from "next/link";
import { getArticleIllustration } from "@/lib/illustrations";

/**
 * The card for an article this language does not have yet.
 *
 * It keeps the article's identity. An earlier version replaced the title and the
 * summary with the same localised placeholder on every card, and the grid became
 * twelve indistinguishable tiles — the reader could no longer tell which essay
 * was which, which is a worse failure than showing an English headline.
 *
 * So the title and the excerpt stay English and carry `lang="en"`, which tells a
 * screen reader to switch voice and stops the browser offering to translate a
 * page it thinks is wholly Telugu. Everything that is *chrome* — badge, call to
 * action, category, date, reading time — is localised, because none of it is
 * article prose.
 *
 * Layout is identical to a translated card: same aspect ratio, radius, border,
 * shadow and hover lift, so the grid does not reflow as translations land.
 */
export interface UntranslatedCardStrings {
  badge: string;
  cta: string;
}

export default function UntranslatedCard({
  slug,
  title,
  excerpt,
  englishHref,
  categoryLabel,
  dateLabel,
  readingLabel,
  strings,
  featured = false,
}: {
  slug: string;
  title: string;
  excerpt: string;
  englishHref: string;
  categoryLabel?: string;
  dateLabel?: string;
  readingLabel?: string;
  strings: UntranslatedCardStrings;
  featured?: boolean;
}) {
  return (
    <Link
      href={englishHref}
      hrefLang="en-IN"
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gold/20 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-xl hover:shadow-gold/10"
    >
      <div
        className={`relative w-full overflow-hidden bg-travertine ${
          featured ? "aspect-[16/9]" : "aspect-[16/10]"
        }`}
      >
        <Image
          src={getArticleIllustration(slug)}
          alt=""
          fill
          aria-hidden="true"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          sizes={featured ? "(max-width: 1024px) 100vw, 65vw" : "(max-width: 768px) 100vw, 33vw"}
        />
        <div className="absolute start-4 top-4 rounded-full border border-white/50 bg-ivory/90 px-3 py-1 backdrop-blur-md">
          <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[#8A6736]">
            {strings.badge}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-7 md:p-8">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-grey">
            {categoryLabel && (
              <span className="rounded border border-gold/20 bg-sand/20 px-2 py-0.5 font-semibold text-gold-ink">
                {categoryLabel}
              </span>
            )}
            <span className="font-mono text-stone-grey/70">{dateLabel ?? readingLabel}</span>
          </div>

          {/* English, and marked as such. */}
          <h3
            lang="en"
            className={`display mt-4 leading-snug text-charcoal ${
              featured ? "text-3xl md:text-4xl" : "text-xl"
            }`}
          >
            {title}
          </h3>
          <p lang="en" className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-grey">
            {excerpt}
          </p>
        </div>

        <span className="mt-6 inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-[#8A6736]">
          {strings.cta}
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  );
}
