"use client";

import { useState } from "react";
import Image from "next/image";
import { site } from "@/lib/site";

interface Asset {
  id: string;
  title: string;
  type: "IMAGE" | "VIDEO" | "NEWS" | "BROCHURE";
  project: "Sanctuary" | "Raghunath County" | "Mansanpally" | "Corporate";
  url: string;
  thumbnail?: string;
  aspect?: string;
  caption?: string;
}

const ASSETS: Asset[] = [
  // ── SANCTUARY ──
  {
    id: "s-1",
    title: "Sanctuary 4K Grand Entrance Gate",
    type: "IMAGE",
    project: "Sanctuary",
    url: "/assets/Sanctuary_gate.jpg.jpeg",
    aspect: "aspect-[16/10]",
    caption: "Architectural 4K master elevation of the grand gated security portal at Julkal, Shankarpally.",
  },
  {
    id: "s-2",
    title: "Sanctuary 25,000 sq.ft. Luxury Clubhouse & Pool",
    type: "IMAGE",
    project: "Sanctuary",
    url: "/assets/Sanctuary_clubhouse.jpg.jpeg",
    aspect: "aspect-[16/10]",
    caption: "Five-star lifestyle amenities including Olympic pool, indoor badminton, banquet and fine dining.",
  },
  {
    id: "s-3",
    title: "Sanctuary Landscaped Central Park & Promenade",
    type: "IMAGE",
    project: "Sanctuary",
    url: "/assets/Sanctuary_park.jpg.jpeg",
    aspect: "aspect-[16/10]",
    caption: "Avenue plantations, paved walkways, outdoor amphitheater, and meditation zones.",
  },
  {
    id: "s-6",
    title: "Sanctuary 45-Acre Masterplan Film & Drone Walkthrough",
    type: "VIDEO",
    project: "Sanctuary",
    url: "/assets/Sanctuary_site-ad-1.mp4",
    caption: "Cinematic drone overview and commercial walkthrough of Sanctuary.",
  },

  {
    id: "s-pdf-1",
    title: "Official Sanctuary E-Brochure (Full 120MB Edition)",
    type: "BROCHURE",
    project: "Sanctuary",
    url: "/assets/Sanctuary E Brochure.pdf",
    caption: "Complete master layout, villa plot sizes, 25,000 sq.ft. clubhouse architectural drawings and specifications.",
  },
  {
    id: "s-pdf-2",
    title: "Sanctuary TS RERA Sanction Certificate (P01100010026)",
    type: "BROCHURE",
    project: "Sanctuary",
    url: "/assets/Sanctuary RERA Certificate - P01100010026.pdf",
    caption: "Official Telangana Real Estate Regulatory Authority statutory approval certificate.",
  },
  {
    id: "s-pdf-3",
    title: "HMDA Sanctioned Layout Approval Order",
    type: "BROCHURE",
    project: "Sanctuary",
    url: "/assets/BPO1_010327_LO_HMDA_2691_SKP_2024 (1).pdf",
    caption: "HMDA final sanctioned layout order LO/HMDA/2691/SKP/2024.",
  },
  {
    id: "s-pdf-4",
    title: "Julkal Master Layout Plan & Plot Registry",
    type: "BROCHURE",
    project: "Sanctuary",
    url: "/assets/JULKAL.pdf",
    caption: "Official survey layout plan showing all demarcated plots and open green spaces.",
  },
  {
    id: "s-pdf-5",
    title: "Julkal Clubhouse Architectural Drawings (Rev R1)",
    type: "BROCHURE",
    project: "Sanctuary",
    url: "/assets/Julkal_Clubhouse_Plans_R1_24.10.2025 (1).pdf",
    caption: "Detailed architectural blueprints for the 25,000 sq.ft. clubhouse and Olympic swimming pool.",
  },

  // ── RAGHUNATH COUNTY ──
  {
    id: "rc-pdf-1",
    title: "Official Raghunath County E-Brochure",
    type: "BROCHURE",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH COUNTY-E Brochure.pdf",
    caption: "Official brochure detailing the 19-acre clear-title plotted layout on the 100-ft Shankarpally road.",
  },
  {
    id: "rc-v-main1",
    title: "Raghunath County — Official Project Film & Highway Tour",
    type: "VIDEO",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH-COUNTY-WORK-IN-PROGRESS-Advertisement-video.mp4",
    caption: "Full cinematic commercial and 100-ft highway tour of Raghunath County.",
  },
  {
    id: "rc-v-main2",
    title: "Site Progress: 100-Ft Frontage & CC Road Laying",
    type: "VIDEO",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH-COUNTY-WORK-IN-PROGRESS-VIDEO-1.mp4",
    caption: "Live engineering documentary showing concrete road casting and kerbing.",
  },
  {
    id: "rc-v-main3",
    title: "Internal Infrastructure, Drainage & Underground Utilities",
    type: "VIDEO",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH-COUNTY-WORK-IN-PROGRESS-VIDEO-2.mp4",
    caption: "Comprehensive site documentation of utility trenches and avenue formation.",
  },
  {
    id: "rc-1",
    title: "Raghunath County 100-Ft Main Road Frontage",
    type: "IMAGE",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH-COUNTY-IMAGE-1.jpeg",
    aspect: "aspect-[4/3]",
    caption: "Direct access on the Shankarpally to Mehtabkhan Guda–Mominpet 100-feet highway.",
  },
  {
    id: "rc-2",
    title: "40-Ft and 33-Ft Concrete Road Network",
    type: "IMAGE",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH-COUNTY-IMAGE-2.jpeg",
    aspect: "aspect-[4/3]",
    caption: "Heavy-duty CC internal roads with durable kerbing and drainage.",
  },
  {
    id: "rc-3",
    title: "Demarcated Villa Plots & Open Spaces",
    type: "IMAGE",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH-COUNTY-IMAGE-3.jpeg",
    aspect: "aspect-[4/3]",
    caption: "Clear-title DTCP approved plots ready for immediate ownership transfer.",
  },
  {
    id: "rc-4",
    title: "Avenue Plantation & Street Infrastructure",
    type: "IMAGE",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH-COUNTY-IMAGE-4.jpeg",
    aspect: "aspect-[4/3]",
    caption: "Lush green internal avenues with modern electrification and LED illumination.",
  },
  {
    id: "rc-5-img",
    title: "Landscaped Open Commons & Community Spaces",
    type: "IMAGE",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH-COUNTY-IMAGE-5.jpeg",
    aspect: "aspect-[4/3]",
    caption: "Open green recreational parks and landscaped commons.",
  },
  {
    id: "rc-6-img",
    title: "Secured Perimeter Compound Wall & Entry Arch",
    type: "IMAGE",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH-COUNTY-IMAGE-6.jpeg",
    aspect: "aspect-[4/3]",
    caption: "Reinforced boundary wall enclosing the entire 19-acre layout.",
  },
  {
    id: "rc-7-img",
    title: "Wide Angle Site Perspective Across Raghunath County",
    type: "IMAGE",
    project: "Raghunath County",
    url: "/assets/RAGHUNATH-COUNTY-IMAGE-7.jpeg",
    aspect: "aspect-[4/3]",
    caption: "Panoramic view over the layout and surrounding greenery.",
  },
  {
    id: "rc-5",
    title: "Raghunath County 100-Ft Road Walkthrough",
    type: "VIDEO",
    project: "Raghunath County",
    url: "/assets/Ragunath_county_Video_short1.mp4",
    caption: "Short video walkthrough of the highway approach and entrance arch.",
  },
  {
    id: "rc-6",
    title: "Internal CC Road Construction Progress",
    type: "VIDEO",
    project: "Raghunath County",
    url: "/assets/Ragunath_county_Video_short2.mp4",
    caption: "On-site video documenting road casting and concrete quality.",
  },
  {
    id: "rc-7",
    title: "Raghunath County Project Presentation",
    type: "VIDEO",
    project: "Raghunath County",
    url: "/assets/Ragunath_county_Video_short3.mp4",
    caption: "Full presentation covering location benefits, pricing, and DTCP approval.",
  },
  {
    id: "rc-8",
    title: "Raghunath County Master Aerial Tour",
    type: "VIDEO",
    project: "Raghunath County",
    url: "/assets/Ragunath_county_Video_short7.mp4",
    caption: "Complete drone tour capturing the entire 19-acre layout and surroundings.",
  },

  // ── MANSANPALLY ──
  {
    id: "m-2",
    title: "Mansanpally Regional Connectivity & Layout Map",
    type: "BROCHURE",
    project: "Mansanpally",
    url: "/assets/Mansanpally_2.jpeg",
    aspect: "aspect-[3/4]",
    caption: "Strategic connectivity to Rajiv Gandhi International Airport, Pharma City, and RRR.",
  },

  // ── SHORTS & REELS ──
  {
    id: "v-1",
    title: "Why Invest in Shankarpally — Growth Analysis",
    type: "VIDEO",
    project: "Corporate",
    url: "/assets/Terravion_shankarpally_short1.mp4",
    caption: "Market analysis on West Hyderabad's high capital appreciation trajectory.",
  },
  {
    id: "v-2",
    title: "100-Ft Road & ORR Exit 3 Connectivity",
    type: "VIDEO",
    project: "Corporate",
    url: "/assets/Terravion_shankarpally_short2.mp4",
    caption: "Fast commute times from Financial District, Kokapet, and Gachibowli.",
  },
  {
    id: "v-3",
    title: "Executive Site Briefing on Masterplan Quality",
    type: "VIDEO",
    project: "Corporate",
    url: "/assets/Terravion_shankarpally_short4.mp4",
    caption: "Engineering briefing on HMDA & DTCP infrastructure quality standards.",
  },
  {
    id: "v-4",
    title: "Regional Ring Road (RRR) Alignment Impact",
    type: "VIDEO",
    project: "Corporate",
    url: "/assets/Terravion_shankarpally_short6.mp4",
    caption: "How the upcoming RRR expressway accelerates Shankarpally land valuation.",
  },

  // ── NEWS & PRESS COVERAGE ──
  {
    id: "n-1",
    title: "Economic Times: West Hyderabad Realty Boom",
    type: "NEWS",
    project: "Corporate",
    url: "/assets/Terravion_news_article_1.jpeg",
    aspect: "aspect-[3/4]",
    caption: "Major national coverage analyzing the surge in luxury plotted demand in Shankarpally.",
  },
  {
    id: "n-2",
    title: "Telangana Today: Shankarpally Emerges as Next Neopolis",
    type: "NEWS",
    project: "Corporate",
    url: "/assets/Terravion_news_article_2.jpeg",
    aspect: "aspect-[3/4]",
    caption: "Infrastructure report highlighting seamless 25-minute connection to Financial District.",
  },
  {
    id: "n-3",
    title: "Eenadu: Shankarpally 4-Lane Highway Expansion",
    type: "NEWS",
    project: "Raghunath County",
    url: "/assets/Ragunath_county_news_article_1.jpeg",
    aspect: "aspect-[3/4]",
    caption: "State sanction for 100-feet road widening towards Mominpet.",
  },
  {
    id: "n-4",
    title: "Namasthe Telangana: DTCP Approval Standards",
    type: "NEWS",
    project: "Raghunath County",
    url: "/assets/Ragunath_county_news_article_2.jpeg",
    aspect: "aspect-[3/4]",
    caption: "Official verification of sanctioned layout parameters and title transparency.",
  },
  {
    id: "n-5",
    title: "Sakshi: Shankarpally Suburban Rail & MMTS Phase 2",
    type: "NEWS",
    project: "Corporate",
    url: "/assets/Ragunath_county_news_article_3.jpeg",
    aspect: "aspect-[3/4]",
    caption: "Rapid transit expansion connecting Shankarpally to central Hyderabad.",
  },
  {
    id: "n-6",
    title: "The Hindu: Future City & Southern Axis Vision",
    type: "NEWS",
    project: "Corporate",
    url: "/assets/Terravion_news_article_5.jpeg",
    aspect: "aspect-[3/4]",
    caption: "Strategic roadmap for Telangana's upcoming aerospace and logistics hubs.",
  },
];

const CATEGORIES = [
  { id: "ALL", label: "All Media" },
  { id: "SANCTUARY", label: "Sanctuary (Shankarpally)" },
  { id: "RAGHUNATH", label: "Raghunath County" },
  { id: "MANSANPALLY", label: "Mansanpally" },
  { id: "VIDEOS", label: "Drone Videos & Reels" },
  { id: "NEWS", label: "Newspaper & Press" },
];

export default function GalleryViewer() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filteredAssets = ASSETS.filter((a) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "SANCTUARY") return a.project === "Sanctuary";
    if (activeTab === "RAGHUNATH") return a.project === "Raghunath County";
    if (activeTab === "MANSANPALLY") return a.project === "Mansanpally";
    if (activeTab === "VIDEOS") return a.type === "VIDEO";
    if (activeTab === "NEWS") return a.type === "NEWS" || a.type === "BROCHURE";
    return true;
  });

  return (
    <div>
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2.5 my-10">
        {CATEGORIES.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#b88d23] text-white shadow-md"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Media Assets */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => setSelectedAsset(asset)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:border-amber-300 hover:shadow-lg cursor-pointer"
          >
            {asset.type === "VIDEO" ? (
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <video
                  src={asset.url}
                  preload="metadata"
                  muted
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#b88d23] text-white shadow-lg group-hover:scale-110 transition-transform">
                    ▶
                  </div>
                </div>
                <span className="absolute top-3 left-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                  {asset.project} · Video
                </span>
              </div>
            ) : (
              <div className={`relative ${asset.aspect || "aspect-[16/10]"} w-full overflow-hidden bg-slate-100`}>
                <Image
                  src={asset.url}
                  alt={asset.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                  {asset.project} · {asset.type === "NEWS" ? "Press" : asset.type === "BROCHURE" ? "Brochure" : "Photo / Render"}
                </span>
              </div>
            )}

            <div className="p-4 flex-1 flex flex-col justify-between bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#946c0b] transition-colors leading-snug">
                  {asset.title}
                </h3>
                {asset.caption && (
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {asset.caption}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#946c0b]">
                  {asset.type === "VIDEO" ? "Watch Video →" : "View Full Size ↗"}
                </span>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Check out ${asset.title} by Terravion: ${site.domain}/gallery`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  <span>Share</span>
                  <span>💬</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / Modal for Selected Asset */}
      {selectedAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">{selectedAsset.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedAsset.project} · {selectedAsset.type}</p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Media Body */}
            <div className="relative max-h-[65vh] w-full overflow-auto bg-slate-950 flex items-center justify-center p-2">
              {selectedAsset.type === "VIDEO" ? (
                <video
                  src={selectedAsset.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[60vh] w-full object-contain"
                />
              ) : (
                <div className="relative h-[60vh] w-full">
                  <Image
                    src={selectedAsset.url}
                    alt={selectedAsset.title}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
              <p className="text-xs text-slate-600 max-w-xl">{selectedAsset.caption}</p>
              <div className="flex items-center gap-3">
                <a
                  href={selectedAsset.url}
                  download
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Download Asset ⬇
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Sharing ${selectedAsset.title} — Terravion Properties`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <span>Share on WhatsApp</span>
                  <span>💬</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
