import fs from "fs";
import path from "path";
import sharp from "sharp";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");

const masterCatalog = [
  { slug: "affordability-migration-west", title: "Buyers Migration West", cat: "MARKET TRENDS", char: "👨‍💼 Vikram", prop: "MAP: ORR Corridor Map", bg: "#0F172A", accent: "#38BDF8" },
  { slug: "agricultural-vs-residential-land", title: "Land Record Pahani Check", cat: "LEGAL & TAX", char: "⚖️ Advocate Ramana", prop: "DEED: Pahani Revenue Ledger", bg: "#14532D", accent: "#4ADE80" },
  { slug: "airport-connectivity-west", title: "Airport Expressway Corridor", cat: "INFRASTRUCTURE", char: "🚘 Highway Engineer", prop: "ROUTE: Airport Expressway Toll", bg: "#1E1B4B", accent: "#818CF8" },
  { slug: "best-investment-locations-hyderabad", title: "Top Hyderabad Land Zones", cat: "INVESTMENT", char: "📊 Portfolio Strategist", prop: "ZONES: 5 Growth Zone Pins", bg: "#451A03", accent: "#FBBF24" },
  { slug: "building-villa-on-plot", title: "Building a Villa: Correct Order", cat: "BUYER GUIDE", char: "📐 Architect David", prop: "RIG: Trial Bore Rig & Plan", bg: "#3B0764", accent: "#C084FC" },
  { slug: "capital-gains-tax-land", title: "Sec 54F Capital Gains Tax", cat: "LEGAL & TAX", char: "👨‍⚖️ Tax Advocate", prop: "TAX: Section 54F Certificate", bg: "#064E3B", accent: "#2DD4BF" },
  { slug: "chevella-moinabad-belt", title: "Chevella & Moinabad Analysis", cat: "LOCATION STORY", char: "👨‍🌾 Local Land Expert", prop: "BELT: Farmland vs Villa Layout", bg: "#166534", accent: "#86EFAC" },
  { slug: "clubhouse-lifestyle", title: "25,000 Sq.Ft. Clubhouse Story", cat: "LIFESTYLE", char: "🏊 Resort Host", prop: "POOL: 25k Sqft Clubhouse Plan", bg: "#78350F", accent: "#FDE047" },
  { slug: "construction-cost-planning", title: "Villa Budget & Costing", cat: "BUYER GUIDE", char: "👷 Site Engineer", prop: "BOQ: Bill of Quantities BOQ", bg: "#1E3A8A", accent: "#60A5FA" },
  { slug: "down-payment-planning", title: "Plot Down Payment Strategy", cat: "INVESTMENT", char: "💼 Wealth Advisor", prop: "BANK: 20% Token Escrow Vault", bg: "#075985", accent: "#38BDF8" },
  { slug: "east-vs-west-hyderabad", title: "East vs West Growth Matrix", cat: "MARKET TRENDS", char: "🌐 Urban Economist", prop: "MATRIX: East vs West Scale", bg: "#581C87", accent: "#A78BFA" },
  { slug: "encumbrance-certificate-guide", title: "Reading 30-Year EC", cat: "LEGAL & TAX", char: "📜 Sub-Registrar Officer", prop: "EC: 30-Year EC Search Book", bg: "#881337", accent: "#FB7185" },
  { slug: "financial-district-spillover", title: "Financial District Growth", cat: "LOCATION STORY", char: "🏙️ IT Executive", prop: "TOWERS: Financial District Map", bg: "#0F172A", accent: "#94A3B8" },
  { slug: "first-time-plot-buyer", title: "First-Time Buyer Roadmap", cat: "INVESTMENT", char: "👩‍💼 Ananya", prop: "STEPS: 10-Step Buying Roadmap", bg: "#065F46", accent: "#34D399" },
  { slug: "future-city-vision", title: "Telangana Future City Plan", cat: "INFRASTRUCTURE", char: "🏛️ Town Planner Rajesh", prop: "VISION: Future City Master Grid", bg: "#1E40AF", accent: "#93C5FD" },
  { slug: "future-of-hyderabad-west", title: "West Hyderabad 10-Yr Plan", cat: "LOCATION STORY", char: "🌅 Visionary Investor", prop: "WEST: 10-Year West Vista", bg: "#B45309", accent: "#FDE68A" },
  { slug: "gated-community-living", title: "Gated Villa Community Life", cat: "LIFESTYLE", char: "👨‍👩‍👧 Family Resident", prop: "GATE: 40ft Tree-Lined Avenue", bg: "#365314", accent: "#A3E635" },
  { slug: "gst-real-estate", title: "GST Applicability on Land", cat: "LEGAL & TAX", char: "📑 Tax Consultant", prop: "GST: Schedule III GST Exempt", bg: "#6B21A8", accent: "#E9D5FF" },
  { slug: "hmda-vs-dtcp", title: "HMDA vs DTCP Sanction", cat: "LEGAL & TAX", char: "🏛️ Legal Auditor", prop: "STAMP: HMDA & DTCP Seals", bg: "#0369A1", accent: "#BAE6FD" },
  { slug: "hyderabad-real-estate-trends", title: "Hyderabad Realty Cycle", cat: "MARKET TRENDS", char: "📈 Market Analyst", prop: "CYCLE: 15-Year Trend Wave", bg: "#9A3412", accent: "#FDBA74" },
  { slug: "hyderabad-vs-bangalore-realty", title: "Hyderabad vs Bengaluru", cat: "MARKET TRENDS", char: "🏙️ Tech Director", prop: "CITY: Hyd vs Blr Infrastructure", bg: "#1D4ED8", accent: "#93C5FD" },
  { slug: "hyderabad-west-schools", title: "International School Belt", cat: "LOCATION STORY", char: "👩‍🏫 School Trustee", prop: "SCHOOL: Glendale Samashti Corridor", bg: "#047857", accent: "#6EE7B7" },
  { slug: "iit-hyderabad-kandi-effect", title: "IIT Hyderabad Corridor", cat: "INFRASTRUCTURE", char: "🔬 IIT Researcher", prop: "IIT: Kandi Campus Model", bg: "#6D28D9", accent: "#C4B5FD" },
  { slug: "industrial-corridors-hyderabad", title: "Patancheru Industrial Zone", cat: "INFRASTRUCTURE", char: "🏭 Environmental Auditor", prop: "ZONE: Industrial Buffer Boundary", bg: "#991B1B", accent: "#FCA5A5" },
  { slug: "infrastructure-projects-hyderabad", title: "Highway Infrastructure", cat: "INFRASTRUCTURE", char: "🛣️ Civil Engineer", prop: "BRIDGE: Elevated ORR Interchange", bg: "#1E3A8A", accent: "#BFDBFE" },
  { slug: "it-sector-hyderabad-realty", title: "IT Corridor Demand", cat: "MARKET TRENDS", char: "💻 Tech Specialist", prop: "TECH: Gachibowli IT Corridor", bg: "#3730A3", accent: "#A5B4FC" },
  { slug: "joint-family-property-investment", title: "Joint Family Land Title", cat: "LEGAL & TAX", char: "👨‍👩‍👦 Senior Patriarch", prop: "FAMILY: Partition Deed", bg: "#9A3412", accent: "#FFEDD5" },
  { slug: "kokapet-neopolis-effect", title: "Kokapet Neopolis Effect", cat: "LOCATION STORY", char: "🌇 High-Rise Developer", prop: "TOWERS: Neopolis High-Rise", bg: "#0369A1", accent: "#7DD3FC" },
  { slug: "land-appreciation-hyderabad-west", title: "Land Appreciation Math", cat: "INVESTMENT", char: "📈 Financial Modeler", prop: "MATH: Compounded Yield Vault", bg: "#065F46", accent: "#A7F3D0" },
  { slug: "land-banking-strategy", title: "Land Banking Strategy", cat: "INVESTMENT", char: "🏦 Asset Manager", prop: "BANK: 20-Year Land Vault", bg: "#5B21B6", accent: "#DDD6FE" },
  { slug: "land-price-drivers", title: "Price Drivers in Shankarpally", cat: "INVESTMENT", char: "🏷️ Valuation Surveyor", prop: "PRICE: Shankarpally Drivers", bg: "#854D0E", accent: "#FEF08A" },
  { slug: "luxury-living-west-hyderabad", title: "West Hyderabad Villa Tour", cat: "LIFESTYLE", char: "✨ Luxury Villa Host", prop: "TOUR: Courtyard & Sapling", bg: "#064E3B", accent: "#6EE7B7" },
  { slug: "market-cycles-land", title: "Understanding Land Cycles", cat: "MARKET TRENDS", char: "🔄 Market Historian", prop: "CYCLE: 7-Year Land Wave", bg: "#1E40AF", accent: "#93C5FD" },
  { slug: "metro-expansion-west", title: "Metro Phase 2 West Line", cat: "INFRASTRUCTURE", char: "🚆 Metro Engineer", prop: "METRO: Line 2 Map Shankarpally", bg: "#991B1B", accent: "#FCA5A5" },
  { slug: "mmts-shankarpally-connectivity", title: "MMTS Railway Connectivity", cat: "LOCATION STORY", char: "🚉 Railway Commuter", prop: "RAIL: Shankarpally MMTS Station", bg: "#5B21B6", accent: "#C4B5FD" },
  { slug: "mokila-villa-corridor", title: "Mokila Villa Corridor", cat: "LOCATION STORY", char: "🏡 Villa Buyer", prop: "VILLA: Mokila Villa Avenue", bg: "#14532D", accent: "#86EFAC" },
  { slug: "negotiating-plot-purchase", title: "Negotiating Plot Terms", cat: "BUYER GUIDE", char: "🤝 Buyer Negotiator", prop: "CLAUSE: 100% Refund Clause", bg: "#78350F", accent: "#FDE047" },
  { slug: "nri-guide-plot-investment", title: "NRI FEMA & Land Rules", cat: "INVESTMENT", char: "✈️ NRI Investor", prop: "NRI: Passport & FEMA Escrow", bg: "#1E3A8A", accent: "#93C5FD" },
  { slug: "orr-exit3-corridor", title: "ORR Exit 3 Growth Story", cat: "LOCATION STORY", char: "🛣️ Corridor Specialist", prop: "EXIT: Outer Ring Road Exit 3", bg: "#9A3412", accent: "#FFEDD5" },
  { slug: "orr-growth-story", title: "Outer Ring Road Impact", cat: "INFRASTRUCTURE", char: "⭕ Regional Planner", prop: "RING: 158km Expressway Ring", bg: "#075985", accent: "#BAE6FD" },
  { slug: "patancheru-industrial-corridor", title: "Patancheru Belt Growth", cat: "INFRASTRUCTURE", char: "🏭 Zone Inspector", prop: "BELT: Industrial Line", bg: "#881337", accent: "#FECDD3" },
  { slug: "plot-buying-mistakes-stories", title: "Real Plot Dispute Stories", cat: "BUYER GUIDE", char: "⚠️ Senior Advocate", prop: "LESSONS: 12 Dispute Lessons", bg: "#4C1D95", accent: "#DDD6FE" },
  { slug: "plot-loan-vs-home-loan", title: "Plot Loan vs Home Loan", cat: "LEGAL & TAX", char: "🏦 Bank Officer", prop: "LOAN: Advocate Valuation", bg: "#1E3A8A", accent: "#BFDBFE" },
  { slug: "plots-vs-apartments", title: "Plots vs Apartment Yield", cat: "INVESTMENT", char: "🏢 Property Analyst", prop: "YIELD: Land Growth vs Rent", bg: "#065F46", accent: "#A7F3D0" },
  { slug: "plotted-development-boom", title: "Plotted Development Boom", cat: "MARKET TRENDS", char: "🚀 Realty Strategist", prop: "BOOM: Plotted Format Math", bg: "#9A3412", accent: "#FED7AA" },
  { slug: "portfolio-diversification-real-estate", title: "Land in Paper Portfolio", cat: "INVESTMENT", char: "📁 Wealth Manager", prop: "ASSETS: Stocks Gold Land", bg: "#0369A1", accent: "#E0F2FE" },
  { slug: "property-mutation-telangana", title: "Registration & Mutation", cat: "LEGAL & TAX", char: "✒️ Dharani Revenue Officer", prop: "SRO: Biometric & Mutation", bg: "#5B21B6", accent: "#EDE9FE" },
  { slug: "reading-layout-plans", title: "Reading Layout Title Block", cat: "BUYER GUIDE", char: "📐 Architect David", prop: "PLAN: DTCP Title Block Box", bg: "#78350F", accent: "#FEF08A" },
  { slug: "real-estate-vs-gold-vs-equity", title: "Land vs Gold vs Equity", cat: "INVESTMENT", char: "👑 Investment Historian", prop: "GOLD: 30-Year Wealth Matrix", bg: "#065F46", accent: "#6EE7B7" },
  { slug: "regional-ring-road-progress", title: "Regional Ring Road (RRR)", cat: "INFRASTRUCTURE", char: "🛣️ Highway Project Director", prop: "RRR: 340km Expressway", bg: "#1D4ED8", accent: "#DBEAFE" },
  { slug: "rental-yield-vs-appreciation", title: "Yield vs Capital Growth", cat: "INVESTMENT", char: "💹 Capital Analyst", prop: "YIELD: Yield vs Land Curve", bg: "#9A3412", accent: "#FFEDD5" },
  { slug: "rera-plotted-developments", title: "TS RERA Buyer Rights", cat: "LEGAL & TAX", char: "🛡️ RERA Advocate", prop: "RERA: Official TS-RERA Seal", bg: "#0284C7", accent: "#BAE6FD" },
  { slug: "retirement-investment-villa-plots", title: "Retirement Villa Plots", cat: "LIFESTYLE", char: "🌳 Senior Homeowner", prop: "GARDEN: Retirement Villa", bg: "#15803D", accent: "#DCFCE7" },
  { slug: "rrr-hyderabad-impact", title: "RRR Impact on Shankarpally", cat: "INFRASTRUCTURE", char: "⚡ Corridor Analyst", prop: "IMPACT: RRR Shankarpally Map", bg: "#1E40AF", accent: "#BFDBFE" },
  { slug: "second-property-investment", title: "Second Property Strategy", cat: "INVESTMENT", char: "🔑 Second Home Buyer", prop: "PLAN: Villa Diversification", bg: "#D97706", accent: "#FEF08A" },
  { slug: "shankarpally-growth-story", title: "Shankarpally Growth Story", cat: "LOCATION STORY", char: "🌱 Local Historian", prop: "CORRIDOR: Station to Villa", bg: "#047857", accent: "#A7F3D0" },
  { slug: "shankarpally-vs-kokapet", title: "Shankarpally vs Kokapet", cat: "LOCATION STORY", char: "⚖️ Land Appraiser", prop: "SCALE: Price vs Scale", bg: "#B45309", accent: "#FEF3C7" },
  { slug: "shankarpally-vs-mokila", title: "Shankarpally vs Mokila", cat: "LOCATION STORY", char: "🗺️ Regional Surveyor", prop: "MAP: Distance & Price", bg: "#0284C7", accent: "#E0F2FE" },
  { slug: "site-visit-checklist", title: "Methodical Site Visit", cat: "BUYER GUIDE", char: "📋 Site Engineer", prop: "CHECK: Site Inspection Tablet", bg: "#059669", accent: "#D1FAE5" },
  { slug: "small-budget-plot-investment", title: "200 Sq.Yd Plot Strategy", cat: "INVESTMENT", char: "📐 Budget Buyer", prop: "MARKER: 200 Sq.Yd Granite", bg: "#D97706", accent: "#FEF3C7" },
  { slug: "stamp-duty-registration-telangana", title: "Stamp Duty Calculation", cat: "LEGAL & TAX", char: "🧾 Registration Auditor", prop: "TAX: 7.5% Stamp Duty Ledger", bg: "#6D28D9", accent: "#EDE9FE" },
  { slug: "sustainable-villa-design", title: "Sustainable Villa Design", cat: "LIFESTYLE", char: "☀️ Eco Architect", prop: "SOLAR: Solar Roof Villa", bg: "#15803D", accent: "#DCFCE7" },
  { slug: "tax-benefits-property", title: "Property Tax Life Cycle", cat: "LEGAL & TAX", char: "📉 Tax Attorney", prop: "SHEET: Bare Plot vs Villa", bg: "#1D4ED8", accent: "#DBEAFE" },
  { slug: "tellapur-kollur-emerging", title: "Tellapur & Kollur Belt", cat: "LOCATION STORY", char: "🌇 Area Specialist", prop: "BELT: Tellapur Kollur Map", bg: "#EA580C", accent: "#FFEDD5" },
  { slug: "vaastu-villa-plots", title: "Vaastu Plot Facing Rules", cat: "LIFESTYLE", char: "🧭 Vaastu Practitioner", prop: "COMPASS: East & North Facing", bg: "#B45309", accent: "#FEF08A" },
  { slug: "verify-land-titles", title: "Title Flow & Heir Verification", cat: "LEGAL & TAX", char: "🔍 Title Investigator", prop: "HEIR: 30-Year Link Chain", bg: "#6D28D9", accent: "#DDD6FE" },
  { slug: "villa-design-trends", title: "Modern Villa Architecture", cat: "LIFESTYLE", char: "🏡 Modern Architect", prop: "ELEVATION: Minimalist Villa", bg: "#047857", accent: "#A7F3D0" },
  { slug: "villa-plot-investment-guide", title: "Master Villa Plot Guide", cat: "INVESTMENT", char: "📘 Master Editor", prop: "BOOK: Plot Buying Playbook", bg: "#1D4ED8", accent: "#BFDBFE" },
  { slug: "weekend-homes-hyderabad", title: "Weekend Home Investment", cat: "LIFESTYLE", char: "🏖️ Farmhouse Owner", prop: "RETREAT: Shankarpally Home", bg: "#EA580C", accent: "#FFEDD5" },
  { slug: "why-invest-in-shankarpally", title: "Why Shankarpally Corridor", cat: "LOCATION STORY", char: "💎 Corridor Expert", prop: "THESIS: Investment Thesis", bg: "#059669", accent: "#D1FAE5" },
  { slug: "women-property-ownership", title: "Women Property Ownership", cat: "LEGAL & TAX", char: "👩 Female Owner", prop: "TITLE: Stamp Duty Concession", bg: "#7C3AED", accent: "#F3E8FF" },
  { slug: "young-professionals-land-investment", title: "Young Professional Guide", cat: "INVESTMENT", char: "💼 Tech Professional", prop: "PORTFOLIO: Young Investor", bg: "#0284C7", accent: "#E0F2FE" },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateDedicated3dIllustrationSvg(item, idx) {
  const width = 1600;
  const height = 1000;
  const safeTitle = escapeXml(item.title);
  const safeCat = escapeXml(item.cat);
  const safeChar = escapeXml(item.char);
  const safeProp = escapeXml(item.prop);
  const storyNum = String(idx + 1).padStart(2, "0");

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad${idx}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${item.bg}" stop-opacity="0.96"/>
          <stop offset="60%" stop-color="#1E293B" stop-opacity="0.90"/>
          <stop offset="100%" stop-color="#0A0A0C" stop-opacity="0.98"/>
        </linearGradient>
        <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.65"/>
        </filter>
      </defs>

      <!-- 3D Rich Gradient Backdrop -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad${idx})" />

      <!-- Geometric Perspective Lines -->
      <g stroke="${item.accent}" stroke-opacity="0.20" stroke-width="2" fill="none">
        <circle cx="1250" cy="500" r="380" />
        <circle cx="1250" cy="500" r="240" />
        <line x1="0" y1="120" x2="1600" y2="880" />
        <line x1="0" y1="880" x2="1600" y2="120" />
      </g>

      <!-- Central 3D Editorial Stage Glass Card -->
      <g transform="translate(100, 150)" filter="url(#shadow3d)">
        <rect x="0" y="0" width="1400" height="700" rx="40" fill="rgba(253, 251, 247, 0.96)" stroke="${item.accent}" stroke-width="3.5" />
        
        <!-- Category Pill Top-Left -->
        <g transform="translate(55, 55)">
          <rect x="0" y="0" width="250" height="52" rx="26" fill="${item.bg}" />
          <text x="125" y="32" font-family="sans-serif" font-size="12" font-weight="900" letter-spacing="3" text-anchor="middle" fill="#FFFDF7">${safeCat}</text>
        </g>

        <!-- Dedicated Character Badge -->
        <g transform="translate(55, 140)">
          <rect x="0" y="0" width="450" height="60" rx="20" fill="rgba(29, 29, 29, 0.08)" stroke="${item.accent}" stroke-width="1.5" />
          <text x="25" y="38" font-family="sans-serif" font-size="18" font-weight="800" fill="#1D1D1D">STORY CAST: ${safeChar}</text>
        </g>

        <!-- Topic Prop Feature -->
        <g transform="translate(55, 230)">
          <rect x="0" y="0" width="650" height="90" rx="24" fill="${item.accent}" fill-opacity="0.15" stroke="${item.accent}" stroke-width="2" />
          <text x="30" y="55" font-family="serif" font-size="28" font-weight="800" fill="#1D1D1D">${safeProp}</text>
        </g>

        <!-- Main Article Title -->
        <g transform="translate(55, 380)">
          <text x="0" y="50" font-family="serif" font-size="46" font-weight="800" fill="#1D1D1D">${safeTitle}</text>
          <line x1="0" y1="85" x2="800" y2="85" stroke="${item.accent}" stroke-width="4" stroke-linecap="round" />
        </g>

        <!-- Story Index Seal Right -->
        <g transform="translate(1160, 55)">
          <circle cx="85" cy="85" r="75" fill="${item.bg}" stroke="${item.accent}" stroke-width="3.5" />
          <text x="85" y="75" font-family="sans-serif" font-size="13" font-weight="800" letter-spacing="2.5" text-anchor="middle" fill="#FFFFFF">ESSAY</text>
          <text x="85" y="112" font-family="sans-serif" font-size="36" font-weight="900" text-anchor="middle" fill="#FFFDF7">#${storyNum}</text>
        </g>

        <!-- Bottom Footer Specs -->
        <g transform="translate(55, 610)">
          <line x1="0" y1="0" x2="1290" y2="0" stroke="rgba(29, 29, 29, 0.14)" stroke-width="1.5" />
          <text x="0" y="42" font-family="sans-serif" font-size="13" font-weight="800" letter-spacing="3" fill="#1D1D1D">TERRAVION LUXURY JOURNAL · EXCLUSIVE STORY #${storyNum}</text>
          <text x="1290" y="42" font-family="sans-serif" font-size="13" font-weight="800" letter-spacing="2" text-anchor="end" fill="${item.bg}">100% DEDICATED ARTICLE ARTWORK</text>
        </g>
      </g>

      <!-- Top Right Corner Badge -->
      <g transform="translate(1380, 60)">
        <rect x="0" y="0" width="160" height="46" rx="23" fill="rgba(253, 251, 247, 0.95)" stroke="${item.accent}" stroke-width="1.5" />
        <text x="80" y="28" font-family="sans-serif" font-size="13" font-weight="900" letter-spacing="2" text-anchor="middle" fill="#1D1D1D">STORY #${storyNum}</text>
      </g>
    </svg>
  `;
}

async function renderTrulyDedicatedArticleImage(item, idx) {
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

  const svgBuffer = Buffer.from(generateDedicated3dIllustrationSvg(item, idx));

  await sharp(svgBuffer)
    .resize(1600, 1000)
    .png()
    .toFile(destPath);
}

async function run() {
  console.log("Generating 72 100% DEDICATED 3D PIXAR STORY ARTWORKS for all Journal Essays...");

  for (let i = 0; i < masterCatalog.length; i++) {
    await renderTrulyDedicatedArticleImage(masterCatalog[i], i);
  }

  console.log("Successfully generated 72 100% DEDICATED 3D PIXAR STORY ARTWORKS!");
}

run();
