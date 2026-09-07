import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/lib/site";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";

/**
 * Metadata has to be a function now, not a constant.
 *
 * A module-scope `const` cannot see `params`, so it cannot know which language
 * it is being rendered for — every locale would emit the English canonical and
 * the Telugu and Hindi pages would ask Google to drop them as duplicates.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslator(locale, ["metadata"]);

  return buildPageMetadata({
    title: t("metadata.testimonials.title"),
    description: t("metadata.testimonials.description"),
    path: "/testimonials",
    locale,
  });
}

/**
 * Policy page by design: no invented quotes, no stock-photo customers.
 * The section fills only with real, consented buyer stories.
 */
export default function TestimonialsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Testimonials", path: "/testimonials" },
            ])
          ),
        }}
      />
      <section className="bg-ivory pb-24 pt-40 md:pb-32 md:pt-52">
        <div className="mx-auto max-w-4xl px-6 md:px-10">
          <Reveal>
            <p className="label text-gold-ink">Buyer stories</p>
            <h1 className="display mt-5 text-5xl leading-[1.02] text-ink md:text-7xl">
              Only the <em className="text-gold-ink">real ones.</em>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">
              A testimonial is worthless unless it's true. We publish buyer
              stories only when a real customer has shared one and consented to
              its use — with their project, plot phase and, where they allow
              it, their name. We never write them ourselves.
            </p>
          </Reveal>

          <Reveal className="mt-16 rounded-3xl border border-dashed border-brass/40 bg-bone p-10 text-center md:p-16">
            <p className="display text-2xl leading-snug text-ink md:text-3xl">
              Verified stories from Sanctuary and Raghunath County owners will
              appear here as they are recorded.
            </p>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-text-secondary">
              In the meantime, we'd rather you form your own view: visit the
              site, meet owners building their homes, and ask them directly —
              we'll happily make the introductions on your visit.
            </p>
          </Reveal>

          <Reveal className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 p-8">
              <h2 className="display text-xl text-ink">Are you an owner?</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Share your buying experience — good and bad. Stories are
                published verbatim with your consent.
              </p>
              <a
                href={`${site.whatsapp}?text=${encodeURIComponent("Hello Terravion — I'm an owner and would like to share my story.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="label mt-6 inline-block rounded-full bg-brass px-6 py-3 text-white transition-colors hover:bg-gold hover:text-charcoal"
              >
                Share your story
              </a>
            </div>
            <div className="rounded-2xl border border-ink/10 p-8">
              <h2 className="display text-xl text-ink">Want references?</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Serious buyers can ask to speak with existing owners before
                booking. We arrange calls with consenting owners on request.
              </p>
              <a
                href={site.phoneHref}
                className="label mt-6 inline-block rounded-full border border-ink/20 px-6 py-3 text-ink transition-colors hover:border-brass hover:text-gold-ink"
              >
                Call {site.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
