import type { Metadata } from "next";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";
import { loadLegal } from "@/lib/legal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslator(locale, ["metadata"]);
  return buildPageMetadata({
    title: t("metadata.privacy.title"),
    description: t("metadata.privacy.description"),
    path: "/privacy-policy",
    locale,
  });
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const { privacy } = await loadLegal(locale);

  return (
    <main className="bg-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: privacy.title, path: "/privacy-policy" },
            ])
          ),
        }}
      />
      <article className="mx-auto max-w-[72ch] px-7 pb-28 pt-36 md:pt-44">
        <h1 className="display text-4xl text-charcoal md:text-5xl">
          {privacy.title}
        </h1>
        <p className="mt-3 text-sm text-stone-grey">
          {privacy.updatedLabel}: {privacy.updated}
        </p>
        <p className="mt-8 text-base leading-relaxed text-text-secondary">
          {privacy.intro}
        </p>
        {privacy.sections.map((s) => (
          <section key={s.h} className="mt-10">
            <h2 className="display text-2xl text-charcoal">{s.h}</h2>
            {s.body.map((p, i) => (
              <p
                key={i}
                className="mt-4 text-base leading-relaxed text-text-secondary"
              >
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
