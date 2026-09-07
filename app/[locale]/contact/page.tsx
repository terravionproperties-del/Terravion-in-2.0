import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import LeadForm from "@/components/forms/LeadForm";
import ExecutiveCards from "@/components/ui/ExecutiveCards";
import { leadFormStrings } from "@/lib/i18n/lead-form";
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
    title: t("metadata.contact.title"),
    description: t("metadata.contact.description"),
    path: "/contact",
    locale,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const formStrings = await leadFormStrings(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Contact", path: "/contact" },
            ])
          ),
        }}
      />
      <section className="bg-ivory pb-24 pt-40 md:pb-32 md:pt-52">
        <div className="shell">
          <Reveal>
            <p className="label text-gold-ink">Contact</p>
            <h1 className="display mt-5 max-w-3xl text-5xl leading-[1.02] text-ink md:text-7xl">
              Talk to a person,
              <em className="text-gold-ink"> not a portal.</em>
            </h1>
          </Reveal>

          <div className="mt-16 grid gap-14 md:grid-cols-2">
            <Reveal className="flex flex-col gap-10">
              <div>
                <p className="label text-text-muted">Call or WhatsApp</p>
                <a href={site.phoneHref} className="display mt-2 block text-3xl text-ink hover:text-gold-ink md:text-4xl">
                  {site.phone}
                </a>
                <p className="mt-2 text-sm text-text-muted">
                  Open daily, 9:00 am – 7:00 pm IST · NRI calls returned across time zones
                </p>
              </div>
              <div>
                <p className="label text-text-muted">Email</p>
                <a href={`mailto:${site.email}`} className="mt-2 block text-xl text-ink underline-offset-4 hover:text-gold-ink hover:underline">
                  {site.email}
                </a>
              </div>
              <div>
                <p className="label text-text-muted">Experience centre</p>
                <address className="mt-2 text-lg not-italic leading-relaxed text-text-secondary">
                  Terravion Properties
                  <br />
                  {site.address.locality}, {site.address.region} {site.address.postalCode}
                </address>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${site.geo.lat},${site.geo.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label mt-4 inline-block text-gold-ink underline-offset-8 hover:underline"
                >
                  Driving directions →
                </a>
              </div>
              <div className="rounded-2xl bg-bone p-6">
                <p className="text-sm leading-relaxed text-text-secondary">
                  <strong className="text-ink">Getting here:</strong> from the
                  Outer Ring Road take Exit 3 towards Patancheru, then the
                  Shankarpally road west — the experience centre is in
                  Shankarpally town, minutes from the railway station.
                  Landmarks en route: IIT Hyderabad (Kandi) to the north,
                  Mokila junction to the east.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="display mb-6 text-2xl text-ink">Request a callback</h2>
              <LeadForm strings={formStrings} intent="Callback request" />
            </Reveal>
          </div>

          {/* ── Senior Leadership Direct Contacts ── */}
          <div className="mt-24 pt-16 border-t border-ink/10">
            <Reveal>
              <ExecutiveCards
                title="Direct Leadership Contacts"
                subtitle="Speak directly with our Associate Vice President and Chief General Manager for immediate layout allocations and site visit coordination."
              />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
