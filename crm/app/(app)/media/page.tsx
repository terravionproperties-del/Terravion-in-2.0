import Link from "next/link";
import { auth } from "@/lib/auth";

export const metadata = { title: "Media Library — Terravion OS" };
export const dynamic = "force-dynamic";

interface MediaAsset {
  id: string;
  title: string;
  category: "3D_RENDER" | "WALKTHROUGH_VIDEO" | "VIDEO_SHORT" | "NEWSPAPER_PRESS" | "BROCHURE_MAP";
  project: "Sanctuary" | "Raghunath County" | "Mansanpally" | "Corporate";
  fileSize: string;
  format: string;
  url: string;
  previewUrl?: string;
  tags: string[];
}

const MEDIA_ASSETS: MediaAsset[] = [
  // ── SANCTUARY (SHANKARPALLY) ──
  {
    id: "m-s1",
    title: "Sanctuary 4K Grand Entrance Gate Arch",
    category: "3D_RENDER",
    project: "Sanctuary",
    fileSize: "16.6 MB",
    format: "JPEG / 4K",
    url: "/assets/Sanctuary_gate.jpg.jpeg",
    tags: ["Entrance Gate", "4K Render", "Security", "Shankarpally"],
  },
  {
    id: "m-s2",
    title: "Sanctuary 25,000 Sq.Ft Luxury Clubhouse & Swimming Pool",
    category: "3D_RENDER",
    project: "Sanctuary",
    fileSize: "9.8 MB",
    format: "JPEG / 4K",
    url: "/assets/Sanctuary_clubhouse.jpg.jpeg",
    tags: ["Clubhouse", "Swimming Pool", "Badminton", "Amenities"],
  },
  {
    id: "m-s3",
    title: "Sanctuary Central Landscaped Park & Promenade",
    category: "3D_RENDER",
    project: "Sanctuary",
    fileSize: "11.8 MB",
    format: "JPEG / 4K",
    url: "/assets/Sanctuary_park.jpg.jpeg",
    tags: ["Parks", "Landscape", "Walkways", "Kids Play"],
  },
  {
    id: "m-s6",
    title: "Sanctuary 45-Acre Masterplan Film & Drone Walkthrough",
    category: "WALKTHROUGH_VIDEO",
    project: "Sanctuary",
    fileSize: "68.3 MB",
    format: "MP4 / HD",
    url: "/assets/Sanctuary_site-ad-1.mp4",
    tags: ["Drone Walkthrough", "Masterplan Film", "Commercial"],
  },

  // ── RAGHUNATH COUNTY ──
  {
    id: "m-rc1",
    title: "Raghunath County 100-Ft Main Road Frontage & Gate",
    category: "3D_RENDER",
    project: "Raghunath County",
    fileSize: "281 KB",
    format: "JPEG",
    url: "/assets/Ragunath_county_Image1.jpeg",
    tags: ["100-Ft Frontage", "Main Road", "Entrance Arch"],
  },
  {
    id: "m-rc2",
    title: "40-Ft & 33-Ft Concrete Road Network with Kerbing",
    category: "3D_RENDER",
    project: "Raghunath County",
    fileSize: "339 KB",
    format: "JPEG",
    url: "/assets/Ragunath_county_Image2.jpeg",
    tags: ["CC Roads", "Internal Avenues", "Kerbing"],
  },
  {
    id: "m-rc3",
    title: "Raghunath County Demarcated Villa Plots",
    category: "3D_RENDER",
    project: "Raghunath County",
    fileSize: "271 KB",
    format: "JPEG",
    url: "/assets/Ragunath_county_Image3.jpeg",
    tags: ["Villa Plots", "Boundary Stones", "DTCP Approved"],
  },
  {
    id: "m-rc4",
    title: "Avenue Plantation & Street Electrification",
    category: "3D_RENDER",
    project: "Raghunath County",
    fileSize: "419 KB",
    format: "JPEG",
    url: "/assets/Ragunath_county_Image4.jpeg",
    tags: ["Avenues", "Plantation", "Streetlights"],
  },
  {
    id: "m-rc5",
    title: "Raghunath County 100-Ft Road Walkthrough",
    category: "VIDEO_SHORT",
    project: "Raghunath County",
    fileSize: "6.0 MB",
    format: "MP4",
    url: "/assets/Ragunath_county_Video_short1.mp4",
    tags: ["Road Walkthrough", "Frontage", "Highway"],
  },
  {
    id: "m-rc6",
    title: "Concrete Road Casting & Infrastructure Video",
    category: "VIDEO_SHORT",
    project: "Raghunath County",
    fileSize: "3.5 MB",
    format: "MP4",
    url: "/assets/Ragunath_county_Video_short2.mp4",
    tags: ["CC Roads", "Construction Quality"],
  },
  {
    id: "m-rc7",
    title: "Raghunath County Project Presentation Reel",
    category: "VIDEO_SHORT",
    project: "Raghunath County",
    fileSize: "23.6 MB",
    format: "MP4",
    url: "/assets/Ragunath_county_Video_short3.mp4",
    tags: ["Project Presentation", "DTCP Title", "Pricing"],
  },
  {
    id: "m-rc8",
    title: "Site Layout & Plot Demarcation Inspection",
    category: "VIDEO_SHORT",
    project: "Raghunath County",
    fileSize: "3.6 MB",
    format: "MP4",
    url: "/assets/Ragunath_county_Video_short4.mp4",
    tags: ["Site Tour", "Plot Demarcation"],
  },
  {
    id: "m-rc9",
    title: "Executive Briefing with Ground Engineers",
    category: "VIDEO_SHORT",
    project: "Raghunath County",
    fileSize: "17.0 MB",
    format: "MP4",
    url: "/assets/Ragunath_county_Video_short5.mp4",
    tags: ["Executive Briefing", "Engineers Tour"],
  },
  {
    id: "m-rc10",
    title: "Shankarpally Station & Town Proximity Reel",
    category: "VIDEO_SHORT",
    project: "Raghunath County",
    fileSize: "3.4 MB",
    format: "MP4",
    url: "/assets/Ragunath_county_Video_short6.mp4",
    tags: ["MMTS Station", "Town Proximity"],
  },
  {
    id: "m-rc11",
    title: "Raghunath County Complete Drone & Highway Tour",
    category: "VIDEO_SHORT",
    project: "Raghunath County",
    fileSize: "20.0 MB",
    format: "MP4",
    url: "/assets/Ragunath_county_Video_short7.mp4",
    tags: ["Drone Tour", "19 Acres", "Aerial"],
  },

  // ── MANSANPALLY ──
  {
    id: "m-m2",
    title: "Mansanpally Regional Connectivity & Masterplan Map",
    category: "BROCHURE_MAP",
    project: "Mansanpally",
    fileSize: "335 KB",
    format: "JPEG / Print",
    url: "/assets/Mansanpally_2.jpeg",
    tags: ["Layout Map", "Airport", "Pharma City", "RRR"],
  },

  // ── SHANKARPALLY SHORTS & REELS ──
  {
    id: "m-sh1",
    title: "Why Invest in Shankarpally — Western Corridor Surge",
    category: "VIDEO_SHORT",
    project: "Corporate",
    fileSize: "6.8 MB",
    format: "MP4",
    url: "/assets/Terravion_shankarpally_short1.mp4",
    tags: ["Why Shankarpally", "Investment Thesis", "Realty Surge"],
  },
  {
    id: "m-sh2",
    title: "100-Ft Road & ORR Exit 3 Fast Highway Connect",
    category: "VIDEO_SHORT",
    project: "Corporate",
    fileSize: "16.1 MB",
    format: "MP4",
    url: "/assets/Terravion_shankarpally_short2.mp4",
    tags: ["ORR Exit 3", "100-Ft Road", "Commute Times"],
  },
  {
    id: "m-sh3",
    title: "Sanctuary Villa Plots Live Site Inspection",
    category: "VIDEO_SHORT",
    project: "Corporate",
    fileSize: "2.4 MB",
    format: "MP4",
    url: "/assets/Terravion_shankarpally_short3.mp4",
    tags: ["Sanctuary", "Site Tour"],
  },
  {
    id: "m-sh4",
    title: "Engineering Briefing: HMDA Sanction Standards",
    category: "VIDEO_SHORT",
    project: "Corporate",
    fileSize: "3.4 MB",
    format: "MP4",
    url: "/assets/Terravion_shankarpally_short4.mp4",
    tags: ["HMDA Standards", "Quality Benchmark"],
  },
  {
    id: "m-sh5",
    title: "Land Banking Strategy: Wealth Creation in West Hyderabad",
    category: "VIDEO_SHORT",
    project: "Corporate",
    fileSize: "9.3 MB",
    format: "MP4",
    url: "/assets/Terravion_shankarpally_short5.mp4",
    tags: ["Land Banking", "Wealth Compounding"],
  },
  {
    id: "m-sh6",
    title: "Regional Ring Road (RRR) Alignment Impact",
    category: "VIDEO_SHORT",
    project: "Corporate",
    fileSize: "1.2 MB",
    format: "MP4",
    url: "/assets/Terravion_shankarpally_short6.mp4",
    tags: ["RRR Alignment", "Appreciation Boost"],
  },

  // ── NEWSPAPER ARTICLES & PRESS ──
  {
    id: "m-n1",
    title: "Economic Times: West Hyderabad Realty Boom",
    category: "NEWSPAPER_PRESS",
    project: "Corporate",
    fileSize: "138 KB",
    format: "JPEG",
    url: "/assets/Terravion_news_article_1.jpeg",
    tags: ["Economic Times", "Press Article", "Market Demand"],
  },
  {
    id: "m-n2",
    title: "Telangana Today: Shankarpally Emerges as New Neopolis",
    category: "NEWSPAPER_PRESS",
    project: "Corporate",
    fileSize: "181 KB",
    format: "JPEG",
    url: "/assets/Terravion_news_article_2.jpeg",
    tags: ["Telangana Today", "Neopolis Neighbor"],
  },
  {
    id: "m-n3",
    title: "Deccan Chronicle: High-Yield Villa Plotting Developments",
    category: "NEWSPAPER_PRESS",
    project: "Corporate",
    fileSize: "248 KB",
    format: "JPEG",
    url: "/assets/Terravion_news_article_4.jpeg",
    tags: ["Deccan Chronicle", "Land Index"],
  },
  {
    id: "m-n4",
    title: "The Hindu: Future City & RRR Infrastructure Roadmap",
    category: "NEWSPAPER_PRESS",
    project: "Corporate",
    fileSize: "116 KB",
    format: "JPEG",
    url: "/assets/Terravion_news_article_5.jpeg",
    tags: ["The Hindu", "Infrastructure Roadmap"],
  },
  {
    id: "m-n5",
    title: "Eenadu: Shankarpally 4-Lane Highway Expansion",
    category: "NEWSPAPER_PRESS",
    project: "Raghunath County",
    fileSize: "270 KB",
    format: "JPEG",
    url: "/assets/Ragunath_county_news_article_1.jpeg",
    tags: ["Eenadu", "4-Lane Road"],
  },
  {
    id: "m-n6",
    title: "Namasthe Telangana: DTCP Approved Layout Standards",
    category: "NEWSPAPER_PRESS",
    project: "Raghunath County",
    fileSize: "401 KB",
    format: "JPEG",
    url: "/assets/Ragunath_county_news_article_2.jpeg",
    tags: ["Namasthe Telangana", "DTCP Verification"],
  },
  {
    id: "m-n7",
    title: "Sakshi: Shankarpally Suburban Rail & MMTS Phase 2",
    category: "NEWSPAPER_PRESS",
    project: "Raghunath County",
    fileSize: "270 KB",
    format: "JPEG",
    url: "/assets/Ragunath_county_news_article_3.jpeg",
    tags: ["Sakshi", "MMTS Phase 2"],
  },
  {
    id: "m-n8",
    title: "Regional Ring Road Map & Shankarpally Junction Alignment",
    category: "NEWSPAPER_PRESS",
    project: "Raghunath County",
    fileSize: "146 KB",
    format: "JPEG",
    url: "/assets/Ragunath_county_news_article_5.jpeg",
    tags: ["RRR Blueprint", "Junction Alignment"],
  },
  {
    id: "m-n9",
    title: "Masterplan Survey Demarcation Notice",
    category: "NEWSPAPER_PRESS",
    project: "Raghunath County",
    fileSize: "195 KB",
    format: "JPEG",
    url: "/assets/Ragunath_county_news_article_6.jpeg",
    tags: ["Survey Notice", "Government Demarcation"],
  },
  {
    id: "m-n10",
    title: "DTCP Sanction Order & Title Clearance",
    category: "NEWSPAPER_PRESS",
    project: "Raghunath County",
    fileSize: "91 KB",
    format: "JPEG",
    url: "/assets/Ragunath_county_news_article_7.jpeg",
    tags: ["DTCP Sanction", "Title Clearance"],
  },
];

export default async function MediaLibraryPage() {
  const session = await auth();

  return (
    <div className="px-8 py-7 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[1.6rem] font-serif font-semibold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Media Library & Marketing Collateral</span>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-[#946c0b] border border-amber-200">
              {MEDIA_ASSETS.length} Verified Assets
            </span>
          </h1>
          <p className="mt-1 text-[0.8125rem] text-slate-500 font-normal">
            Official 4K renders, live drone walkthroughs, video shorts, news archives, and layout maps ready for client dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://terravionproperties.in"}/gallery`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn text-xs font-semibold"
          >
            Public Gallery ↗
          </a>
          <a
            href="https://api.whatsapp.com/send"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-xs font-bold"
          >
            + New WhatsApp Dispatch
          </a>
        </div>
      </header>

      {/* KPI Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Assets", value: MEDIA_ASSETS.length, note: "All verified collateral" },
          { label: "4K Renders & Photos", value: MEDIA_ASSETS.filter((a) => a.category === "3D_RENDER").length, note: "Architectural elevations" },
          { label: "Videos & Reels", value: MEDIA_ASSETS.filter((a) => a.category === "WALKTHROUGH_VIDEO" || a.category === "VIDEO_SHORT").length, note: "Drones, ground & reels" },
          { label: "Press & Layout Maps", value: MEDIA_ASSETS.filter((a) => a.category === "NEWSPAPER_PRESS" || a.category === "BROCHURE_MAP").length, note: "News archives & DTCP files" },
        ].map((c) => (
          <div key={c.label} className="panel p-4">
            <p className="label">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{c.value}</p>
            <p className="mt-1 text-xs text-slate-400 font-medium">{c.note}</p>
          </div>
        ))}
      </div>

      {/* Media Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MEDIA_ASSETS.map((asset) => (
          <div
            key={asset.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between transition-all hover:border-amber-300 hover:shadow-md"
          >
            <div>
              {/* Badge & Format */}
              <div className="flex items-center justify-between mb-3">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-bold text-slate-700 uppercase tracking-wider">
                  {asset.project}
                </span>
                <span className="text-[0.6875rem] font-semibold text-slate-400">
                  {asset.format} · {asset.fileSize}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                {asset.title}
              </h3>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {asset.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-amber-50/80 px-2 py-0.5 text-[0.625rem] font-semibold text-[#946c0b] border border-amber-200/60"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <span>View Asset</span>
                <span>↗</span>
              </a>

              <div className="flex items-center gap-2">
                <a
                  href={asset.url}
                  download
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Download
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Sharing official collateral: ${asset.title} — Terravion Properties: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://terravionproperties.in"}${asset.url}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-colors flex items-center gap-1"
                >
                  <span>WhatsApp</span>
                  <span>💬</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
