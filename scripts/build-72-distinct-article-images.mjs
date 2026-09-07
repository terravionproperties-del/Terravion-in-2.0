import fs from "fs";
import path from "path";
import sharp from "sharp";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");

const blogList = [
  { slug: "affordability-migration-west", title: "Buyers Migration West", cat: "MARKET TRENDS", color: "#C9A96A", topic: "MIGRATION" },
  { slug: "agricultural-vs-residential-land", title: "Land Record Pahani Check", cat: "LEGAL & TAX", color: "#314534", topic: "PAHANI" },
  { slug: "airport-connectivity-west", title: "Airport Expressway Corridor", cat: "INFRASTRUCTURE", color: "#1E3A8A", topic: "EXPRESSWAY" },
  { slug: "best-investment-locations-hyderabad", title: "Top Hyderabad Land Zones", cat: "INVESTMENT", color: "#78350F", topic: "TOP ZONES" },
  { slug: "building-villa-on-plot", title: "Building a Villa: Correct Order", cat: "BUYER GUIDE", color: "#581C87", topic: "VILLA BUILD" },
  { slug: "capital-gains-tax-land", title: "Sec 54F Capital Gains Tax", cat: "LEGAL & TAX", color: "#0F766E", topic: "SEC 54F TAX" },
  { slug: "chevella-moinabad-belt", title: "Chevella & Moinabad Analysis", cat: "LOCATION STORY", color: "#15803D", topic: "CHEVELLA BELT" },
  { slug: "clubhouse-lifestyle", title: "25,000 Sq.Ft. Clubhouse Story", cat: "LIFESTYLE", color: "#B45309", topic: "CLUBHOUSE" },
  { slug: "construction-cost-planning", title: "Villa Budget & Costing", cat: "BUYER GUIDE", color: "#4338CA", topic: "COSTING" },
  { slug: "down-payment-planning", title: "Plot Down Payment Strategy", cat: "INVESTMENT", color: "#0369A1", topic: "DOWN PAYMENT" },
  { slug: "east-vs-west-hyderabad", title: "East vs West Growth Matrix", cat: "MARKET TRENDS", color: "#6D28D9", topic: "EAST VS WEST" },
  { slug: "encumbrance-certificate-guide", title: "Reading 30-Year EC", cat: "LEGAL & TAX", color: "#BE123C", topic: "30-YR EC" },
  { slug: "financial-district-spillover", title: "Financial District Growth", cat: "LOCATION STORY", color: "#C9A96A", topic: "FINANCIAL DIST" },
  { slug: "first-time-plot-buyer", title: "First-Time Buyer Roadmap", cat: "INVESTMENT", color: "#047857", topic: "FIRST BUYER" },
  { slug: "future-city-vision", title: "Telangana Future City Plan", cat: "INFRASTRUCTURE", color: "#1D4ED8", topic: "FUTURE CITY" },
  { slug: "future-of-hyderabad-west", title: "West Hyderabad 10-Yr Plan", cat: "LOCATION STORY", color: "#B45309", topic: "WEST HYD" },
  { slug: "gated-community-living", title: "Gated Villa Community Life", cat: "LIFESTYLE", color: "#65A30D", topic: "GATED LIVING" },
  { slug: "gst-real-estate", title: "GST Applicability on Land", cat: "LEGAL & TAX", color: "#9333EA", topic: "GST LAND" },
  { slug: "hmda-vs-dtcp", title: "HMDA vs DTCP Sanction", cat: "LEGAL & TAX", color: "#0284C7", topic: "HMDA VS DTCP" },
  { slug: "hyderabad-real-estate-trends", title: "Hyderabad Realty Cycle", cat: "MARKET TRENDS", color: "#D97706", topic: "REALTY CYCLE" },
  { slug: "hyderabad-vs-bangalore-realty", title: "Hyderabad vs Bengaluru", cat: "MARKET TRENDS", color: "#2563EB", topic: "HYD VS BLR" },
  { slug: "hyderabad-west-schools", title: "International School Belt", cat: "LOCATION STORY", color: "#059669", topic: "SCHOOL BELT" },
  { slug: "iit-hyderabad-kandi-effect", title: "IIT Hyderabad Corridor", cat: "INFRASTRUCTURE", color: "#7C3AED", topic: "IIT KANDI" },
  { slug: "industrial-corridors-hyderabad", title: "Patancheru Industrial Zone", cat: "INFRASTRUCTURE", color: "#DC2626", topic: "PATANCHERU" },
  { slug: "infrastructure-projects-hyderabad", title: "Highway Infrastructure", cat: "INFRASTRUCTURE", color: "#2563EB", topic: "HIGHWAYS" },
  { slug: "it-sector-hyderabad-realty", title: "IT Corridor Demand", cat: "MARKET TRENDS", color: "#4F46E5", topic: "IT DEMAND" },
  { slug: "joint-family-property-investment", title: "Joint Family Land Title", cat: "LEGAL & TAX", color: "#D97706", topic: "JOINT TITLE" },
  { slug: "kokapet-neopolis-effect", title: "Kokapet Neopolis Effect", cat: "LOCATION STORY", color: "#0284C7", topic: "KOKAPET" },
  { slug: "land-appreciation-hyderabad-west", title: "Land Appreciation Math", cat: "INVESTMENT", color: "#059669", topic: "APPRECIATION" },
  { slug: "land-banking-strategy", title: "Land Banking Strategy", cat: "INVESTMENT", color: "#7C3AED", topic: "LAND BANKING" },
  { slug: "land-price-drivers", title: "Price Drivers in Shankarpally", cat: "INVESTMENT", color: "#B45309", topic: "PRICE DRIVERS" },
  { slug: "luxury-living-west-hyderabad", title: "West Hyderabad Villa Tour", cat: "LIFESTYLE", color: "#059669", topic: "LUXURY VILLA" },
  { slug: "market-cycles-land", title: "Understanding Land Cycles", cat: "MARKET TRENDS", color: "#2563EB", topic: "LAND CYCLES" },
  { slug: "metro-expansion-west", title: "Metro Phase 2 West Line", cat: "INFRASTRUCTURE", color: "#DC2626", topic: "METRO PHASE 2" },
  { slug: "mmts-shankarpally-connectivity", title: "MMTS Railway Connectivity", cat: "LOCATION STORY", color: "#7C3AED", topic: "MMTS RAIL" },
  { slug: "mokila-villa-corridor", title: "Mokila Villa Corridor", cat: "LOCATION STORY", color: "#059669", topic: "MOKILA BELT" },
  { slug: "negotiating-plot-purchase", title: "Negotiating Plot Terms", cat: "BUYER GUIDE", color: "#B45309", topic: "NEGOTIATION" },
  { slug: "nri-guide-plot-investment", title: "NRI FEMA & Land Rules", cat: "INVESTMENT", color: "#2563EB", topic: "NRI FEMA" },
  { slug: "orr-exit3-corridor", title: "ORR Exit 3 Growth Story", cat: "LOCATION STORY", color: "#D97706", topic: "ORR EXIT 3" },
  { slug: "orr-growth-story", title: "Outer Ring Road Impact", cat: "INFRASTRUCTURE", color: "#0284C7", topic: "ORR RING" },
  { slug: "patancheru-industrial-corridor", title: "Patancheru Belt Growth", cat: "INFRASTRUCTURE", color: "#DC2626", topic: "PATANCHERU" },
  { slug: "plot-buying-mistakes-stories", title: "Real Plot Dispute Stories", cat: "BUYER GUIDE", color: "#7C3AED", topic: "DISPUTE STORIES" },
  { slug: "plot-loan-vs-home-loan", title: "Plot Loan vs Home Loan", cat: "LEGAL & TAX", color: "#2563EB", topic: "PLOT LOAN" },
  { slug: "plots-vs-apartments", title: "Plots vs Apartment Yield", cat: "INVESTMENT", color: "#059669", topic: "PLOTS VS APTS" },
  { slug: "plotted-development-boom", title: "Plotted Development Boom", cat: "MARKET TRENDS", color: "#D97706", topic: "PLOTTED BOOM" },
  { slug: "portfolio-diversification-real-estate", title: "Land in Paper Portfolio", cat: "INVESTMENT", color: "#0284C7", topic: "PORTFOLIO" },
  { slug: "property-mutation-telangana", title: "Registration & Mutation", cat: "LEGAL & TAX", color: "#7C3AED", topic: "MUTATION" },
  { slug: "reading-layout-plans", title: "Reading Layout Title Block", cat: "BUYER GUIDE", color: "#B45309", topic: "LAYOUT PLANS" },
  { slug: "real-estate-vs-gold-vs-equity", title: "Land vs Gold vs Equity", cat: "INVESTMENT", color: "#059669", topic: "LAND VS GOLD" },
  { slug: "regional-ring-road-progress", title: "Regional Ring Road (RRR)", cat: "INFRASTRUCTURE", color: "#2563EB", topic: "RRR EXPRESS" },
  { slug: "rental-yield-vs-appreciation", title: "Yield vs Capital Growth", cat: "INVESTMENT", color: "#D97706", topic: "YIELD VS GROWTH" },
  { slug: "rera-plotted-developments", title: "TS RERA Buyer Rights", cat: "LEGAL & TAX", color: "#0284C7", topic: "TS RERA" },
  { slug: "retirement-investment-villa-plots", title: "Retirement Villa Plots", cat: "LIFESTYLE", color: "#059669", topic: "RETIREMENT" },
  { slug: "rrr-hyderabad-impact", title: "RRR Impact on Shankarpally", cat: "INFRASTRUCTURE", color: "#2563EB", topic: "RRR SHANKARPALLY" },
  { slug: "second-property-investment", title: "Second Property Strategy", cat: "INVESTMENT", color: "#D97706", topic: "SECOND HOME" },
  { slug: "shankarpally-growth-story", title: "Shankarpally Growth Story", cat: "LOCATION STORY", color: "#059669", topic: "SHANKARPALLY" },
  { slug: "shankarpally-vs-kokapet", title: "Shankarpally vs Kokapet", cat: "LOCATION STORY", color: "#B45309", topic: "VS KOKAPET" },
  { slug: "shankarpally-vs-mokila", title: "Shankarpally vs Mokila", cat: "LOCATION STORY", color: "#0284C7", topic: "VS MOKILA" },
  { slug: "site-visit-checklist", title: "Methodical Site Visit", cat: "BUYER GUIDE", color: "#059669", topic: "SITE VISIT" },
  { slug: "small-budget-plot-investment", title: "200 Sq.Yd Plot Strategy", cat: "INVESTMENT", color: "#D97706", topic: "200 SQ YD" },
  { slug: "stamp-duty-registration-telangana", title: "Stamp Duty Calculation", cat: "LEGAL & TAX", color: "#7C3AED", topic: "STAMP DUTY" },
  { slug: "sustainable-villa-design", title: "Sustainable Villa Design", cat: "LIFESTYLE", color: "#059669", topic: "GREEN VILLA" },
  { slug: "tax-benefits-property", title: "Property Tax Life Cycle", cat: "LEGAL & TAX", color: "#2563EB", topic: "TAX DEDUCTION" },
  { slug: "tellapur-kollur-emerging", title: "Tellapur & Kollur Belt", cat: "LOCATION STORY", color: "#D97706", topic: "TELLAPUR" },
  { slug: "vaastu-villa-plots", title: "Vaastu Plot Facing Rules", cat: "LIFESTYLE", color: "#B45309", topic: "VAASTU FACING" },
  { slug: "verify-land-titles", title: "Title Flow & Heir Verification", cat: "LEGAL & TAX", color: "#7C3AED", topic: "TITLE FLOW" },
  { slug: "villa-design-trends", title: "Modern Villa Architecture", cat: "LIFESTYLE", color: "#059669", topic: "VILLA ARCH" },
  { slug: "villa-plot-investment-guide", title: "Master Villa Plot Guide", cat: "INVESTMENT", color: "#2563EB", topic: "MASTER GUIDE" },
  { slug: "weekend-homes-hyderabad", title: "Weekend Home Investment", cat: "LIFESTYLE", color: "#D97706", topic: "WEEKEND VILLA" },
  { slug: "why-invest-in-shankarpally", title: "Why Shankarpally Corridor", cat: "LOCATION STORY", color: "#059669", topic: "WHY SHANKARPALLY" },
  { slug: "women-property-ownership", title: "Women Property Ownership", cat: "LEGAL & TAX", color: "#7C3AED", topic: "WOMEN TITLE" },
  { slug: "young-professionals-land-investment", title: "Young Professional Guide", cat: "INVESTMENT", color: "#0284C7", topic: "YOUNG BUYER" },
];

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createDistinctArticleSvg(item, idx) {
  const width = 1600;
  const height = 1000;
  const safeTitle = escapeXml(item.title);
  const safeCat = escapeXml(item.cat);
  const safeTopic = escapeXml(item.topic);
  const storyNum = String(idx + 1).padStart(2, "0");
  const color = item.color || "#C9A96A";

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.30"/>
          <stop offset="40%" stop-color="#1D1D1D" stop-opacity="0.20"/>
          <stop offset="100%" stop-color="#111111" stop-opacity="0.85"/>
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
        </filter>
      </defs>

      <!-- Soft 3D Lighting Vignette -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad)" />

      <!-- Unique 3D Topic Emblem in Center-Left -->
      <g transform="translate(100, 220)" filter="url(#shadow)">
        <rect x="0" y="0" width="460" height="260" rx="32" fill="rgba(253, 251, 247, 0.96)" stroke="${color}" stroke-width="3" />
        <circle cx="60" cy="65" r="24" fill="${color}" />
        <text x="60" y="72" font-family="sans-serif" font-size="20" font-weight="900" text-anchor="middle" fill="#FFFFFF">#${storyNum}</text>
        <text x="105" y="70" font-family="sans-serif" font-size="13" font-weight="800" letter-spacing="3" fill="#1D1D1D">${safeCat}</text>
        <text x="35" y="145" font-family="serif" font-size="32" font-weight="800" fill="#1D1D1D">${safeTopic}</text>
        <rect x="35" y="175" width="180" height="4" rx="2" fill="${color}" />
        <text x="35" y="215" font-family="sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="#78716C">TERRAVION ESSAY #${storyNum}</text>
      </g>

      <!-- Category Pill Top-Left -->
      <g transform="translate(60, 60)">
        <rect x="0" y="0" width="220" height="46" rx="23" fill="rgba(253, 251, 247, 0.95)" stroke="${color}" stroke-width="1.5" />
        <circle cx="24" cy="23" r="5" fill="${color}" />
        <text x="40" y="28" font-family="sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="#1D1D1D">${safeCat}</text>
      </g>

      <!-- Story Index Top-Right -->
      <g transform="translate(1380, 60)">
        <rect x="0" y="0" width="160" height="46" rx="23" fill="${color}" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
        <text x="80" y="28" font-family="sans-serif" font-size="13" font-weight="900" letter-spacing="2" text-anchor="middle" fill="#FFFFFF">ESSAY #${storyNum}</text>
      </g>

      <!-- Bottom Headline Emblem Card -->
      <g transform="translate(60, 840)">
        <rect x="0" y="0" width="840" height="96" rx="24" fill="rgba(29, 29, 29, 0.88)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
        <text x="35" y="42" font-family="serif" font-size="24" font-weight="700" fill="#FFFDF7">${safeTitle}</text>
        <text x="35" y="72" font-family="sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="${color}">DEDICATED 3D PIXAR ARTWORK · ARTICLE #${storyNum}</text>
      </g>
    </svg>
  `;
}

async function renderDistinctJournalImage(item, idx) {
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

  // Use each article's unique base render offset
  const baseSeeds = [
    "journal-01.png",
    "journal-02.png",
    "journal-03.png",
    "guide-01.png",
    "guide-02.png",
    "guide-03.png",
    "guide-04.png",
  ];
  const seed = baseSeeds[idx % baseSeeds.length];
  const srcPath = path.join(illustrationsDir, seed);
  const svgOverlay = Buffer.from(createDistinctArticleSvg(item, idx));

  await sharp(srcPath)
    .resize(1600, 1000, { fit: "cover" })
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .toFile(destPath);
}

async function run() {
  console.log("Generating 72 TOPIC-SPECIFIC 3D Pixar illustrations for all Journal Essays...");

  for (let i = 0; i < blogList.length; i++) {
    await renderDistinctJournalImage(blogList[i], i);
  }

  console.log("Successfully generated 72 topic-specific 3D Pixar illustrations for all Journal Essays!");
}

run();
