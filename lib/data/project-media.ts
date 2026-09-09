/**
 * Project media — galleries, video, news coverage and documents.
 * Assets served from /assets/
 */

const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "").replace(/\/$/, "");

export function mediaUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export interface MediaImage {
  src: string;
  alt: string;
  category?: "render" | "site_photo" | "amenity" | "news" | "masterplan";
  caption?: string;
}

export interface MediaVideo {
  src: string;
  title: string;
  bytes: number;
  duration?: string;
  isShort?: boolean;
}

export interface MediaDocument {
  label: string;
  href: string;
  bytes: number;
  note?: string;
}

export interface ProjectMedia {
  gallery: MediaImage[];
  video: MediaVideo[];
  news: MediaImage[];
  documents: MediaDocument[];
}

export const PROJECT_MEDIA: Record<string, ProjectMedia> = {
  sanctuary: {
    gallery: [
      {
        src: "/assets/Sanctuary_gate.jpg.jpeg",
        alt: "Sanctuary Grand Entrance Arch & Security Gateway — Shankarpally",
        category: "render",
        caption: "4K Architectural elevation of the grand entrance gate and security pavilion.",
      },
      {
        src: "/assets/Sanctuary_clubhouse.jpg.jpeg",
        alt: "Sanctuary 25,000 sq. ft. Luxury Clubhouse & Swimming Pool Complex",
        category: "render",
        caption: "Resort-style clubhouse with pool, badminton courts, and fine dining.",
      },
      {
        src: "/assets/Sanctuary_park.jpg.jpeg",
        alt: "Sanctuary Central Landscaped Park & Walking Corridors",
        category: "render",
        caption: "Avenue plantations, paved walkways, and children's play meadows.",
      },
      {
        src: "/assets/Terravion_images1.jpeg",
        alt: "Terravion Plotted Avenue Perspective",
        category: "site_photo",
        caption: "Paved road kerbing and tree-lined internal avenue.",
      },
      {
        src: "/assets/Terravion_images2.jpeg",
        alt: "Terravion Luxury Modern Villa Architectural Concept",
        category: "render",
        caption: "Ground+1 contemporary villa concept with terrace garden.",
      },
      {
        src: "/assets/Terravion_images3.jpeg",
        alt: "Terravion Gated Community Dusk & Ambient Illumination",
        category: "render",
        caption: "Evening architectural view of villa plots with modern street illumination.",
      },
    ],
    video: [
      {
        src: "/assets/Sanctuary_site-ad-1.mp4",
        title: "Sanctuary — 45-Acre Masterplan Film & Drone Walkthrough",
        bytes: 68_300_148,
        duration: "1:45",
      },
      {
        src: "/assets/Terravion_shankarpally_short1.mp4",
        title: "Why Invest in Shankarpally — Rapid West Growth Story",
        bytes: 6_857_846,
        isShort: true,
      },
      {
        src: "/assets/Terravion_shankarpally_short2.mp4",
        title: "100-Ft Shankarpally Road & Outer Ring Road Access",
        bytes: 16_158_474,
        isShort: true,
      },
      {
        src: "/assets/Terravion_shankarpally_short3.mp4",
        title: "Sanctuary Villa Plots — Site Tour with Lead Engineer",
        bytes: 2_466_433,
        isShort: true,
      },
      {
        src: "/assets/Terravion_shankarpally_short4.mp4",
        title: "Executive Briefing: HMDA Sanctioned Layout Standards",
        bytes: 3_415_688,
        isShort: true,
      },
      {
        src: "/assets/Terravion_shankarpally_short5.mp4",
        title: "Land Banking Strategy: Wealth Creation in Shankarpally",
        bytes: 9_364_588,
        isShort: true,
      },
      {
        src: "/assets/Terravion_shankarpally_short6.mp4",
        title: "Regional Ring Road (RRR) Alignment & Appreciation Impact",
        bytes: 1_297_321,
        isShort: true,
      },
    ],
    news: [
      {
        src: "/assets/Terravion_news_article_1.jpeg",
        alt: "Economic Times Realty: West Hyderabad Plotted Corridor Boom",
        caption: "National real estate analysis on the Shankarpally investment surge.",
      },
      {
        src: "/assets/Terravion_news_article_2.jpeg",
        alt: "Telangana Today: Shankarpally Emerges as New Western Hub",
        caption: "Infrastructure report on ORR Exit 3 expansion and connectivity.",
      },
      {
        src: "/assets/Terravion_news_article_4.jpeg",
        alt: "Deccan Chronicle: High-Yield Villa Plotting Developments",
        caption: "Plotted land appreciation index across prime western suburbs.",
      },
      {
        src: "/assets/Terravion_news_article_5.jpeg",
        alt: "The Hindu Property: Future City Infrastructure Roadmap",
        caption: "Strategic roadmap for Telangana's upcoming western growth axis.",
      },
    ],
    documents: [
      {
        label: "Official Sanctuary E-Brochure (Full Edition)",
        href: "/assets/Sanctuary E Brochure.pdf",
        bytes: 120_096_725,
        note: "Complete layout map, plot dimensions, clubhouse architecture, and specifications.",
      },
      {
        label: "TS RERA Sanction Certificate",
        href: "/assets/Sanctuary RERA Certificate - P01100010026.pdf",
        bytes: 292_846,
        note: "Official Telangana RERA Registration: P01100010026.",
      },
      {
        label: "HMDA Sanctioned Layout Order",
        href: "/assets/BPO1_010327_LO_HMDA_2691_SKP_2024 (1).pdf",
        bytes: 211_087,
        note: "Sanctioned layout approval, LO/HMDA/2691/SKP/2024.",
      },
      {
        label: "Julkal Master Layout Plan",
        href: "/assets/JULKAL.pdf",
        bytes: 228_674,
        note: "Plot numbering, road widths, and open spaces as sanctioned.",
      },
      {
        label: "Clubhouse Architectural Drawings (Revision R1)",
        href: "/assets/Julkal_Clubhouse_Plans_R1_24.10.2025 (1).pdf",
        bytes: 2_254_349,
        note: "25,000 sq.ft. clubhouse blueprint, pool layout, and structural plans.",
      },
    ],
  },

  "raghunath-county": {
    gallery: [
      {
        src: "/assets/RAGHUNATH-COUNTY-IMAGE-1.jpeg",
        alt: "Raghunath County 100-Ft Main Road Frontage & Gate Arch",
        category: "site_photo",
        caption: "Direct frontage on the 100-feet Shankarpally–Mominpet highway.",
      },
      {
        src: "/assets/RAGHUNATH-COUNTY-IMAGE-2.jpeg",
        alt: "40-ft and 33-ft CC Internal Roads at Raghunath County",
        category: "site_photo",
        caption: "Heavy-duty concrete internal avenues with kerbing and storm drainage.",
      },
      {
        src: "/assets/RAGHUNATH-COUNTY-IMAGE-3.jpeg",
        alt: "Demarcated Villa Plots with Boundary Stones",
        category: "site_photo",
        caption: "Clearly demarcated plots ready for immediate villa construction.",
      },
      {
        src: "/assets/RAGHUNATH-COUNTY-IMAGE-4.jpeg",
        alt: "Avenue Plantation & Street Lighting Infrastructure",
        category: "site_photo",
        caption: "Tree-lined internal avenues with modern electrification.",
      },
      {
        src: "/assets/RAGHUNATH-COUNTY-IMAGE-5.jpeg",
        alt: "Landscaped Open Commons & Community Spaces",
        category: "site_photo",
        caption: "Open green recreational parks and landscaped commons.",
      },
      {
        src: "/assets/RAGHUNATH-COUNTY-IMAGE-6.jpeg",
        alt: "Secured Perimeter Compound Wall & Entry Arch",
        category: "site_photo",
        caption: "Reinforced boundary wall enclosing the entire 19-acre layout.",
      },
      {
        src: "/assets/RAGHUNATH-COUNTY-IMAGE-7.jpeg",
        alt: "Wide Angle Site Perspective Across Raghunath County",
        category: "site_photo",
        caption: "Panoramic view over the layout and surrounding greenery.",
      },
    ],
    video: [
      {
        src: "/assets/RAGHUNATH-COUNTY-WORK-IN-PROGRESS-Advertisement-video.mp4",
        title: "Raghunath County — Official Project Film & Highway Tour",
        bytes: 70_338_436,
        duration: "1:30",
      },
      {
        src: "/assets/RAGHUNATH-COUNTY-WORK-IN-PROGRESS-VIDEO-1.mp4",
        title: "Site Progress: 100-Ft Frontage & CC Road Laying",
        bytes: 73_566_490,
        duration: "1:42",
      },
      {
        src: "/assets/RAGHUNATH-COUNTY-WORK-IN-PROGRESS-VIDEO-2.mp4",
        title: "Internal Infrastructure, Drainage & Underground Utilities",
        bytes: 75_954_538,
        duration: "1:48",
      },
      {
        src: "/assets/Ragunath_county_Video_short1.mp4",
        title: "Raghunath County — 100-ft Highway Frontage Tour",
        bytes: 6_013_259,
        isShort: true,
      },
      {
        src: "/assets/Ragunath_county_Video_short2.mp4",
        title: "Concrete Road Laying & Kerb Infrastructure Progress",
        bytes: 3_522_153,
        isShort: true,
      },
      {
        src: "/assets/Ragunath_county_Video_short3.mp4",
        title: "Project Overview: Clear DTCP Title Land in Shankarpally",
        bytes: 23_661_030,
        isShort: true,
      },
      {
        src: "/assets/Ragunath_county_Video_short4.mp4",
        title: "Site Layout Walkthrough & Corner Plot Inspection",
        bytes: 3_613_096,
        isShort: true,
      },
      {
        src: "/assets/Ragunath_county_Video_short5.mp4",
        title: "Executive Site Briefing with On-Ground Engineers",
        bytes: 17_078_107,
        isShort: true,
      },
      {
        src: "/assets/Ragunath_county_Video_short6.mp4",
        title: "Shankarpally Station & Town Center Proximity",
        bytes: 3_468_854,
        isShort: true,
      },
      {
        src: "/assets/Ragunath_county_Video_short7.mp4",
        title: "Raghunath County — Complete Drone & Road Master Tour",
        bytes: 20_056_669,
        isShort: true,
      },
    ],
    news: [
      {
        src: "/assets/Ragunath_county_news_article_1.jpeg",
        alt: "Eenadu: Shankarpally to Mominpet 4-Lane Highway Upgrades",
        caption: "Infrastructure report on road expansion in Shankarpally.",
      },
      {
        src: "/assets/Ragunath_county_news_article_2.jpeg",
        alt: "Namasthe Telangana: DTCP Approved Layout Compliance Guidelines",
        caption: "Guidelines on clear title plotted communities.",
      },
      {
        src: "/assets/Ragunath_county_news_article_3.jpeg",
        alt: "Sakshi: Shankarpally Suburban Rail & MMTS Phase 2 Corridor",
        caption: "Public transport connectivity expansion to Shankarpally.",
      },
      {
        src: "/assets/Ragunath_county_news_article_4.jpeg",
        alt: "Vaartha: Real Estate Land Banking in Shankarpally",
        caption: "Analysis of 100-ft road frontage value appreciation.",
      },
      {
        src: "/assets/Ragunath_county_news_article_5.jpeg",
        alt: "Regional Ring Road Map & Shankarpally Junction Alignment",
        caption: "State infrastructure blueprint showing the RRR loop.",
      },
      {
        src: "/assets/Ragunath_county_news_article_6.jpeg",
        alt: "Masterplan Survey Demarcation Notice",
        caption: "Government layout approval and demarcation records.",
      },
      {
        src: "/assets/Ragunath_county_news_article_7.jpeg",
        alt: "DTCP Final Layout Sanction Documentation",
        caption: "Official DTCP sanction letter and title verification.",
      },
    ],
    documents: [
      {
        label: "Official Raghunath County E-Brochure",
        href: "/assets/RAGHUNATH COUNTY-E Brochure.pdf",
        bytes: 16_861_635,
        note: "Layout map, plot sizes, road dimensions, and surrounding growth corridor.",
      },
      {
        label: "DTCP Sanctioned Layout Blueprint",
        href: "/assets/Ragunath_county_news_article_6.jpeg",
        bytes: 195_470,
        note: "Sanctioned road widths and plot numbering.",
      },
    ],
  },

  mansanpally: {
    gallery: [
      {
        src: "/assets/Mansanpally_2.jpeg",
        alt: "Mansanpally Master Layout & Regional Connectivity Map",
        category: "masterplan",
        caption: "Proximity map to Rajiv Gandhi International Airport, Srisailam Highway, and RRR.",
      },
      {
        src: "/assets/Terravion_images1.jpeg",
        alt: "Mansanpally Landscape Perspective",
        category: "render",
        caption: "Planned gated perimeter and avenue plantations.",
      },
    ],
    video: [
      {
        src: "/assets/Terravion_shankarpally_short1.mp4",
        title: "West Hyderabad Corridor Growth Thesis",
        bytes: 6_857_846,
        isShort: true,
      },
      {
        src: "/assets/Terravion_shankarpally_short5.mp4",
        title: "Investor Guide to Strategic Land Holdings in West Hyderabad",
        bytes: 9_364_588,
        isShort: true,
      },
    ],
    news: [
      {
        src: "/assets/Terravion_news_article_1.jpeg",
        alt: "Economic Times: West Hyderabad Infrastructure",
        caption: "Regional ring road and logistics corridor development.",
      },
      {
        src: "/assets/Terravion_news_article_5.jpeg",
        alt: "The Hindu: Metro Extension & West Hyderabad Connectivity",
        caption: "Strategic public transport alignment to Mansanpally.",
      },
    ],
    documents: [
      {
        label: "Mansanpally Regional Connectivity Map",
        href: "/assets/Mansanpally_2.jpeg",
        bytes: 335_886,
        note: "Road network and corridor master plan.",
      },
    ],
  },
};

export function mediaFor(slug: string): ProjectMedia | null {
  return PROJECT_MEDIA[slug] ?? null;
}
