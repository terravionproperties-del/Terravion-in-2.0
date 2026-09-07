import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/lib/site";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";
import GalleryViewer from "@/components/gallery/GalleryViewer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslator(locale, ["metadata"]);

  return buildPageMetadata({
    title: t("metadata.gallery.title") || "Visual Gallery & 4K Media — Terravion Properties",
    description: t("metadata.gallery.description") || "Explore 4K architectural renders, live site drone videos, layout master plans and press coverage for Sanctuary, Raghunath County, and Mansanpally.",
    path: "/gallery",
    locale,
  });
}

export default function GalleryPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Gallery", path: "/gallery" },
            ])
          ),
        }}
      />
      <section className="bg-[#fcfaf7] pb-24 pt-36 text-slate-900 md:pb-32 md:pt-48 border-b border-slate-200">
        <div className="shell">
          <Reveal>
            <p className="label text-[#b88d23]">Official Visual Vault</p>
            <h1 className="display mt-4 max-w-3xl text-5xl leading-[1.02] text-slate-900 md:text-7xl font-serif">
              The Land, On <em className="text-[#b88d23] not-italic">The Record.</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Photographed on site and documented through high-resolution 4K architectural renders, live drone footage, and official newspaper archives. Every asset below reflects verified ground truth.
            </p>
          </Reveal>

          {/* Interactive Gallery Viewer */}
          <GalleryViewer />

          {/* Request Custom Collateral */}
          <Reveal className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center md:p-12 shadow-sm">
            <h3 className="font-serif text-2xl font-bold text-slate-900">
              Need High-Resolution Collateral or Raw Drone Files?
            </h3>
            <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
              Our marketing and sales advisory desk dispatches official CAD master plans, DTCP sanction orders, and high-bitrate video reels directly via WhatsApp.
            </p>
            <a
              href={`${site.whatsapp}?text=${encodeURIComponent("Hello Terravion — please share high-res project brochures and drone walkthrough videos.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c59b27] to-[#a67c1e] px-8 py-4 text-sm font-bold text-white shadow-md hover:brightness-105 transition-all"
            >
              <span>Request Assets on WhatsApp</span>
              <span>💬</span>
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
