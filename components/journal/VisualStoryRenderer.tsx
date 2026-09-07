import Image from "next/image";
import Link from "next/link";
import { renderInlineMarkdown, slugify } from "@/lib/markdown";
import { localizePath, type Locale } from "@/lib/i18n/config";

interface VisualStoryRendererProps {
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
  category: string;
  locale: Locale;
}

interface Chapter {
  id: string;
  title: string;
  contentHtml: string;
}

/**
 * VisualStoryRenderer — Luxury editorial storybook reader.
 * Designed with Apple, Aman, and Bloomberg long-form typography standards:
 * Generous 18px-20px prose font sizes, commanding chapter titles, and crisp 3D hero artwork scale.
 */
export interface StoryChromeStrings {
  chapter: string;
  chapterCount: string;
  storybookFormat: string;
  todaysStory: string;
  storySummaryAria: string;
  verifiedData: string;
  timeline: string;
  conclusion: string;
  expertInsight: string;
}

export default function VisualStoryRenderer({
  slug,
  title,
  excerpt,
  bodyMd,
  category,
  locale,
  strings,
}: VisualStoryRendererProps & { strings: StoryChromeStrings }) {
  // Parse Markdown into Chapters split by '## ' headings
  const chapters: Chapter[] = [];
  const rawSections = bodyMd.split(/^##\s+/m);

  // First section (before any ## heading)
  const introMd = rawSections[0].trim();

  for (let i = 1; i < rawSections.length; i++) {
    const lines = rawSections[i].split("\n");
    const headingText = lines[0].replace(/[*_`]/g, "").trim();
    const bodyContent = lines.slice(1).join("\n").trim();
    const id = headingText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const html = renderChapterMarkdown(bodyContent, strings, locale);

    chapters.push({
      id,
      title: headingText,
      contentHtml: html,
    });
  }

  // Fallback if no ## headings were found
  if (chapters.length === 0) {
    chapters.push({
      id: "story-overview",
      title: "Story Breakdown",
      contentHtml: renderChapterMarkdown(bodyMd, strings, locale),
    });
  }

  return (
    <div className="space-y-16">
      {/* 1. VISUAL SUMMARY CARD — Today's Story */}
      <section aria-label={strings.storySummaryAria} className="rounded-3xl border border-gold/30 bg-white/95 p-8 shadow-xl md:p-12">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold-ink">
            ★
          </span>
          <p className="label text-sm text-gold-ink">{strings.todaysStory}</p>
        </div>
        <h2 className="display mt-4 text-3xl leading-tight text-charcoal md:text-4xl">
          {title}
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-stone-grey md:text-xl">
          {excerpt}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-gold/15 pt-6 text-xs md:text-sm text-stone-grey">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-charcoal">{strings.storybookFormat}</span>
          </div>
          <span>·</span>
          <span>{strings.chapterCount.replace("{count}", String(chapters.length))}</span>
          <span>·</span>
          <span>{strings.verifiedData}</span>
        </div>
      </section>

      {/* Intro text if present */}
      {introMd && (
        <div
          className="article-prose text-lg md:text-xl leading-[1.8] text-stone-grey"
          dangerouslySetInnerHTML={{ __html: renderChapterMarkdown(introMd, strings, locale) }}
        />
      )}

      {/* 2. SPLIT CHAPTER SECTIONS — BALANCED PROSE & ELEGANT TYPOGRAPHY */}
      {chapters.map((ch, idx) => {
        return (
          <section key={ch.id || idx} id={ch.id} className="pt-8">
            {/* Chapter Badge */}
            <div className="mb-6 flex items-center gap-4">
              <span className="rounded-full border border-gold/30 bg-gold/10 px-5 py-2 font-mono text-xs md:text-sm font-bold uppercase tracking-widest text-gold-ink">
                {strings.chapter} {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="h-px flex-1 bg-gold/20" />
            </div>

            {/* Chapter Heading */}
            <h2 className="display mb-8 text-3xl leading-tight text-charcoal md:text-5xl">
              {ch.title}
            </h2>

            {/* Chapter Content */}
            <div
              className="article-prose space-y-8 text-stone-grey text-lg md:text-xl leading-[1.8]"
              dangerouslySetInnerHTML={{ __html: ch.contentHtml }}
            />
          </section>
        );
      })}

      {/* 3. ILLUSTRATED CONCLUSION & HAPPY ENDING CARD */}
      <section aria-label={strings.conclusion} className="rounded-3xl border border-gold/30 bg-gradient-to-br from-white via-ivory to-travertine p-8 shadow-xl md:p-12">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-gold" />
          <p className="label text-sm text-gold-ink">{strings.conclusion}</p>
        </div>
        <h3 className="display mt-4 text-3xl leading-snug text-charcoal md:text-5xl">
          The Outcome: Clear Title, Safe Investment.
        </h3>
        <p className="mt-5 text-lg leading-relaxed text-stone-grey md:text-xl">
          By following this visual roadmap, buyers protect their hard-earned money and walk onto their plot with complete peace of mind.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href={localizePath("/site-visit", locale)} className="btn-gold !text-charcoal !px-8 !py-4 !text-base">
            Walk the Land in Person →
          </Link>
          <Link href={localizePath("/contact", locale)} className="btn-ghost !px-8 !py-4 !text-base">
            Talk to Title Advocate
          </Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Converter for markdown blocks inside chapters with drop caps & callouts.
 *
 * Block layout is bespoke — the callout card, the numbered timeline and the
 * drop cap have no markdown equivalent — but every run of *inline* text is
 * handed to `renderInlineMarkdown`, which is what turns `[text](/path)` into
 * a real anchor (localised for this reader) and `**text**` into `<strong>`.
 * Doing inline text by hand here is how the raw `](/guides/…)` syntax ended
 * up visible in the body of every article.
 */
function renderChapterMarkdown(
  md: string,
  strings: StoryChromeStrings,
  locale: Locale
): string {
  const inline = (text: string) => renderInlineMarkdown(text, locale);

  return md
    .split(/\n\n+/)
    .map((block, i) => {
      const p = block.trim();
      if (!p) return "";

      // Sub-headings (### and deeper; ## already split into chapters above).
      // `.article-prose h3` owns their type scale, so they carry no classes.
      const heading = /^(#{3,6})\s+(.+)$/.exec(p);
      if (heading) {
        const depth = heading[1].length;
        const text = heading[2].trim();
        return `<h${depth} id="${slugify(text)}">${inline(text)}</h${depth}>`;
      }

      // Blockquotes -> Golden Tip Callout Cards
      if (p.startsWith(">")) {
        const text = p.replace(/^>\s*/gm, "").trim();
        return `
          <div class="my-10 rounded-3xl border-s-4 border-gold bg-gold/10 p-8 shadow-sm">
            <p class="label text-xs md:text-sm text-gold-ink">★ ${strings.expertInsight}</p>
            <p class="mt-3 text-lg md:text-xl italic font-serif leading-relaxed text-charcoal">${inline(text)}</p>
          </div>
        `;
      }

      // Ordered Lists -> Illustrated Step Timelines
      if (/^\d+\.\s+/.test(p)) {
        const items = p
          .split(/\n/)
          .map((line) => line.replace(/^\d+\.\s+/, "").trim())
          .filter(Boolean);
        return `
          <div class="my-10 rounded-3xl border border-gold/20 bg-white/95 p-8 shadow-md">
            <p class="label text-xs md:text-sm text-gold-ink mb-6">${strings.timeline}</p>
            <div class="space-y-5">
              ${items
                .map(
                  (item, idx) => `
                <div class="flex items-start gap-4">
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-charcoal">
                    ${idx + 1}
                  </span>
                  <p class="text-base md:text-lg text-charcoal leading-relaxed pt-0.5">${inline(item)}</p>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `;
      }

      // Unordered Lists
      if (/^[-*]\s+/.test(p)) {
        const items = p
          .split(/\n/)
          .map((line) => line.replace(/^[-*]\s+/, "").trim())
          .filter(Boolean);
        return `
          <ul class="my-8 space-y-3 list-disc list-inside text-stone-grey text-lg md:text-xl leading-[1.8]">
            ${items.map((item) => `<li>${inline(item)}</li>`).join("")}
          </ul>
        `;
      }

      // Paragraph 1 Drop Cap styling
      if (i === 0 && /^[A-Za-z]/.test(p)) {
        return `<p class="first-letter:float-left first-letter:me-4 first-letter:font-serif first-letter:text-7xl md:first-letter:text-8xl first-letter:font-light first-letter:leading-none first-letter:text-gold-ink text-lg md:text-xl leading-[1.8] text-stone-grey">${inline(p)}</p>`;
      }

      return `<p class="text-lg md:text-xl leading-[1.8] text-stone-grey">${inline(p)}</p>`;
    })
    .join("\n");
}
