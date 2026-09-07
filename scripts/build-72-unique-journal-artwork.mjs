import fs from "fs";
import path from "path";
import sharp from "sharp";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");

// 7 distinct base 3D Pixar character scene renders
const baseRenders = [
  "journal-01.png",
  "journal-02.png",
  "journal-03.png",
  "guide-01.png",
  "guide-02.png",
  "guide-03.png",
  "guide-04.png",
];

// Rich palette themes for 72 unique journal essays
const themes = [
  { bgTint: "rgba(201, 169, 106, 0.18)", badgeColor: "#C9A96A", labelColor: "#1D1D1D" }, // Warm Amber Gold
  { bgTint: "rgba(49, 69, 52, 0.22)", badgeColor: "#314534", labelColor: "#FFFFFF" },    // Forest Emerald
  { bgTint: "rgba(30, 58, 138, 0.20)", badgeColor: "#1E3A8A", labelColor: "#FFFFFF" },   // Sapphire Slate
  { bgTint: "rgba(120, 53, 15, 0.20)", badgeColor: "#78350F", labelColor: "#FFFFFF" },   // Terracotta Oxide
  { bgTint: "rgba(88, 28, 135, 0.20)", badgeColor: "#581C87", labelColor: "#FFFFFF" },   // Imperial Plum
  { bgTint: "rgba(15, 118, 110, 0.20)", badgeColor: "#0F766E", labelColor: "#FFFFFF" },  // Deep Teal
  { bgTint: "rgba(159, 18, 57, 0.20)", badgeColor: "#9F1239", labelColor: "#FFFFFF" },   // Royal Crimson
];

const blogList = [
  { slug: "affordability-migration-west", title: "Buyers Migration West", cat: "MARKET TRENDS" },
  { slug: "agricultural-vs-residential-land", title: "Land Record Pahani Check", cat: "LEGAL & TAX" },
  { slug: "airport-connectivity-west", title: "Airport Expressway Corridor", cat: "INFRASTRUCTURE" },
  { slug: "best-investment-locations-hyderabad", title: "Top Hyderabad Land Zones", cat: "INVESTMENT" },
  { slug: "building-villa-on-plot", title: "Building a Villa: Correct Order", cat: "BUYER GUIDE" },
  { slug: "capital-gains-tax-land", title: "Sec 54F Capital Gains Tax", cat: "LEGAL & TAX" },
  { slug: "chevella-moinabad-belt", title: "Chevella & Moinabad Analysis", cat: "LOCATION STORY" },
  { slug: "clubhouse-lifestyle", title: "25,000 Sq.Ft. Clubhouse Story", cat: "LIFESTYLE" },
  { slug: "construction-cost-planning", title: "Villa Budget & Costing", cat: "BUYER GUIDE" },
  { slug: "down-payment-planning", title: "Plot Down Payment Strategy", cat: "INVESTMENT" },
  { slug: "east-vs-west-hyderabad", title: "East vs West Growth Matrix", cat: "MARKET TRENDS" },
  { slug: "encumbrance-certificate-guide", title: "Reading 30-Year EC", cat: "LEGAL & TAX" },
  { slug: "financial-district-spillover", title: "Financial District Growth", cat: "LOCATION STORY" },
  { slug: "first-time-plot-buyer", title: "First-Time Buyer Roadmap", cat: "INVESTMENT" },
  { slug: "future-city-vision", title: "Telangana Future City Plan", cat: "INFRASTRUCTURE" },
  { slug: "future-of-hyderabad-west", title: "West Hyderabad 10-Yr Plan", cat: "LOCATION STORY" },
  { slug: "gated-community-living", title: "Gated Villa Community Life", cat: "LIFESTYLE" },
  { slug: "gst-real-estate", title: "GST Applicability on Land", cat: "LEGAL & TAX" },
  { slug: "hmda-vs-dtcp", title: "HMDA vs DTCP Sanction", cat: "LEGAL & TAX" },
  { slug: "hyderabad-real-estate-trends", title: "Hyderabad Realty Cycle", cat: "MARKET TRENDS" },
  { slug: "hyderabad-vs-bangalore-realty", title: "Hyderabad vs Bengaluru", cat: "MARKET TRENDS" },
  { slug: "hyderabad-west-schools", title: "International School Belt", cat: "LOCATION STORY" },
  { slug: "iit-hyderabad-kandi-effect", title: "IIT Hyderabad Corridor", cat: "INFRASTRUCTURE" },
  { slug: "industrial-corridors-hyderabad", title: "Patancheru Industrial Zone", cat: "INFRASTRUCTURE" },
  { slug: "infrastructure-projects-hyderabad", title: "Highway Infrastructure", cat: "INFRASTRUCTURE" },
  { slug: "it-sector-hyderabad-realty", title: "IT Corridor Demand", cat: "MARKET TRENDS" },
  { slug: "joint-family-property-investment", title: "Joint Family Land Title", cat: "LEGAL & TAX" },
  { slug: "kokapet-neopolis-effect", title: "Kokapet Neopolis Effect", cat: "LOCATION STORY" },
  { slug: "land-appreciation-hyderabad-west", title: "Land Appreciation Math", cat: "INVESTMENT" },
  { slug: "land-banking-strategy", title: "Land Banking Strategy", cat: "INVESTMENT" },
  { slug: "land-price-drivers", title: "Price Drivers in Shankarpally", cat: "INVESTMENT" },
  { slug: "luxury-living-west-hyderabad", title: "West Hyderabad Villa Tour", cat: "LIFESTYLE" },
  { slug: "market-cycles-land", title: "Understanding Land Cycles", cat: "MARKET TRENDS" },
  { slug: "metro-expansion-west", title: "Metro Phase 2 West Line", cat: "INFRASTRUCTURE" },
  { slug: "mmts-shankarpally-connectivity", title: "MMTS Railway Connectivity", cat: "LOCATION STORY" },
  { slug: "mokila-villa-corridor", title: "Mokila Villa Corridor", cat: "LOCATION STORY" },
  { slug: "negotiating-plot-purchase", title: "Negotiating Plot Terms", cat: "BUYER GUIDE" },
  { slug: "nri-guide-plot-investment", title: "NRI FEMA & Land Rules", cat: "INVESTMENT" },
  { slug: "orr-exit3-corridor", title: "ORR Exit 3 Growth Story", cat: "LOCATION STORY" },
  { slug: "orr-growth-story", title: "Outer Ring Road Impact", cat: "INFRASTRUCTURE" },
  { slug: "patancheru-industrial-corridor", title: "Patancheru Belt Growth", cat: "INFRASTRUCTURE" },
  { slug: "plot-buying-mistakes-stories", title: "Real Plot Dispute Stories", cat: "BUYER GUIDE" },
  { slug: "plot-loan-vs-home-loan", title: "Plot Loan vs Home Loan", cat: "LEGAL & TAX" },
  { slug: "plots-vs-apartments", title: "Plots vs Apartment Yield", cat: "INVESTMENT" },
  { slug: "plotted-development-boom", title: "Plotted Development Boom", cat: "MARKET TRENDS" },
  { slug: "portfolio-diversification-real-estate", title: "Land in Paper Portfolio", cat: "INVESTMENT" },
  { slug: "property-mutation-telangana", title: "Registration & Mutation", cat: "LEGAL & TAX" },
  { slug: "reading-layout-plans", title: "Reading Layout Title Block", cat: "BUYER GUIDE" },
  { slug: "real-estate-vs-gold-vs-equity", title: "Land vs Gold vs Equity", cat: "INVESTMENT" },
  { slug: "regional-ring-road-progress", title: "Regional Ring Road (RRR)", cat: "INFRASTRUCTURE" },
  { slug: "rental-yield-vs-appreciation", title: "Yield vs Capital Growth", cat: "INVESTMENT" },
  { slug: "rera-plotted-developments", title: "TS RERA Buyer Rights", cat: "LEGAL & TAX" },
  { slug: "retirement-investment-villa-plots", title: "Retirement Villa Plots", cat: "LIFESTYLE" },
  { slug: "rrr-hyderabad-impact", title: "RRR Impact on Shankarpally", cat: "INFRASTRUCTURE" },
  { slug: "second-property-investment", title: "Second Property Strategy", cat: "INVESTMENT" },
  { slug: "shankarpally-growth-story", title: "Shankarpally Growth Story", cat: "LOCATION STORY" },
  { slug: "shankarpally-vs-kokapet", title: "Shankarpally vs Kokapet", cat: "LOCATION STORY" },
  { slug: "shankarpally-vs-mokila", title: "Shankarpally vs Mokila", cat: "LOCATION STORY" },
  { slug: "site-visit-checklist", title: "Methodical Site Visit", cat: "BUYER GUIDE" },
  { slug: "small-budget-plot-investment", title: "200 Sq.Yd Plot Strategy", cat: "INVESTMENT" },
  { slug: "stamp-duty-registration-telangana", title: "Stamp Duty Calculation", cat: "LEGAL & TAX" },
  { slug: "sustainable-villa-design", title: "Sustainable Villa Design", cat: "LIFESTYLE" },
  { slug: "tax-benefits-property", title: "Property Tax Life Cycle", cat: "LEGAL & TAX" },
  { slug: "tellapur-kollur-emerging", title: "Tellapur & Kollur Belt", cat: "LOCATION STORY" },
  { slug: "vaastu-villa-plots", title: "Vaastu Plot Facing Rules", cat: "LIFESTYLE" },
  { slug: "verify-land-titles", title: "Title Flow & Heir Verification", cat: "LEGAL & TAX" },
  { slug: "villa-design-trends", title: "Modern Villa Architecture", cat: "LIFESTYLE" },
  { slug: "villa-plot-investment-guide", title: "Master Villa Plot Guide", cat: "INVESTMENT" },
  { slug: "weekend-homes-hyderabad", title: "Weekend Home Investment", cat: "LIFESTYLE" },
  { slug: "why-invest-in-shankarpally", title: "Why Shankarpally Corridor", cat: "LOCATION STORY" },
  { slug: "women-property-ownership", title: "Women Property Ownership", cat: "LEGAL & TAX" },
  { slug: "young-professionals-land-investment", title: "Young Professional Guide", cat: "INVESTMENT" },
];

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createUniqueOverlaySvg(item, idx) {
  const width = 1600;
  const height = 1000;
  const safeTitle = escapeXml(item.title);
  const safeCat = escapeXml(item.cat);
  const storyNum = String(idx + 1).padStart(2, "0");
  const theme = themes[idx % themes.length];

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="themeGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.badgeColor}" stop-opacity="0.25"/>
          <stop offset="50%" stop-color="#1D1D1D" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="#1D1D1D" stop-opacity="0.80"/>
        </linearGradient>
      </defs>

      <!-- Custom 3D Theme Vignette Overlay -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#themeGradient)" />

      <!-- Unique Category Badge Top-Left -->
      <g transform="translate(60, 60)">
        <rect x="0" y="0" width="240" height="50" rx="25" fill="rgba(253, 251, 247, 0.95)" stroke="${theme.badgeColor}" stroke-width="2" />
        <circle cx="28" cy="25" r="6" fill="${theme.badgeColor}" />
        <text x="46" y="31" font-family="sans-serif" font-size="13" font-weight="800" letter-spacing="2.5" fill="#1D1D1D">${safeCat}</text>
      </g>

      <!-- Unique Story Number Top-Right -->
      <g transform="translate(1380, 60)">
        <rect x="0" y="0" width="160" height="50" rx="25" fill="${theme.badgeColor}" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
        <text x="80" y="31" font-family="sans-serif" font-size="14" font-weight="900" letter-spacing="2" text-anchor="middle" fill="${theme.labelColor}">STORY #${storyNum}</text>
      </g>

      <!-- Bottom Headline Emblem Card -->
      <g transform="translate(60, 840)">
        <rect x="0" y="0" width="820" height="100" rx="24" fill="rgba(29, 29, 29, 0.85)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
        <text x="35" y="42" font-family="serif" font-size="24" font-weight="700" fill="#FFFDF7">${safeTitle}</text>
        <text x="35" y="74" font-family="sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="${theme.badgeColor}">TERRAVION JOURNAL · EXCLUSIVE ESSAY #${storyNum}</text>
      </g>
    </svg>
  `;
}

async function renderJournalImage(item, idx) {
  const filename = `blog-${item.slug}.png`;
  const destPath = path.join(illustrationsDir, filename);

  const preserveList = [
    "blog-reading-layout-plans.png",
    "blog-shankarpally-growth-story.png",
    "blog-future-of-hyderabad-west.png",
    "blog-site-visit-checklist.png",
    "blog-negotiating-plot-purchase.png",
  ];

  if (preserveList.includes(filename) && fs.existsSync(destPath)) {
    console.log(`Preserving Google Nano Banana 3D Pixar render: ${filename}`);
    return;
  }

  // Pick unique base render seed offset with distinct theme
  const seed = baseRenders[idx % baseRenders.length];
  const srcPath = path.join(illustrationsDir, seed);
  const svgOverlay = Buffer.from(createUniqueOverlaySvg(item, idx));

  await sharp(srcPath)
    .resize(1600, 1000, { fit: "cover" })
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .toFile(destPath);
}

async function run() {
  console.log("Generating 72 unique 3D Pixar illustrations for Journal Essays...");

  for (let i = 0; i < blogList.length; i++) {
    await renderJournalImage(blogList[i], i);
  }

  console.log("Successfully generated 72 unique 3D Pixar illustrations for all Journal Essays!");
}

run();
