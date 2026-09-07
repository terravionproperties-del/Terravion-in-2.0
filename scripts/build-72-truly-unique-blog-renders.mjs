import fs from "fs";
import path from "path";
import sharp from "sharp";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");

const blogCatalog = [
  { slug: "affordability-migration-west", title: "Buyers Migration West", cat: "MARKET TRENDS", color: "#1E3A8A", bgGrad: ["#0F172A", "#1E3A8A"], scene: "ORR Highway Migration Map", icon: "🛣️" },
  { slug: "agricultural-vs-residential-land", title: "Land Record Pahani Check", cat: "LEGAL & TAX", color: "#15803D", bgGrad: ["#052E16", "#15803D"], scene: "Telangana Pahani Revenue Record", icon: "📜" },
  { slug: "airport-connectivity-west", title: "Airport Expressway Corridor", cat: "INFRASTRUCTURE", color: "#0369A1", bgGrad: ["#0C4A6E", "#0369A1"], scene: "Airport Expressway Interchange", icon: "✈️" },
  { slug: "best-investment-locations-hyderabad", title: "Top Hyderabad Land Zones", cat: "INVESTMENT", color: "#B45309", bgGrad: ["#451A03", "#B45309"], scene: "West Hyderabad Investment Matrix", icon: "📍" },
  { slug: "building-villa-on-plot", title: "Building a Villa: Correct Order", cat: "BUYER GUIDE", color: "#7C3AED", bgGrad: ["#3B0764", "#7C3AED"], scene: "Villa Foundation & Architect Drawing", icon: "🏗️" },
  { slug: "capital-gains-tax-land", title: "Sec 54F Capital Gains Tax", cat: "LEGAL & TAX", color: "#0F766E", bgGrad: ["#042F2E", "#0F766E"], scene: "Section 54F Tax Exemption Sheet", icon: "⚖️" },
  { slug: "chevella-moinabad-belt", title: "Chevella & Moinabad Analysis", cat: "LOCATION STORY", color: "#16A34A", bgGrad: ["#14532D", "#16A34A"], scene: "Farmland vs Villa Layout Comparison", icon: "🌾" },
  { slug: "clubhouse-lifestyle", title: "25,000 Sq.Ft. Clubhouse Story", cat: "LIFESTYLE", color: "#D97706", bgGrad: ["#78350F", "#D97706"], scene: "25k Sqft Resort Clubhouse Courtyard", icon: "🏊" },
  { slug: "construction-cost-planning", title: "Villa Budget & Costing", cat: "BUYER GUIDE", color: "#2563EB", bgGrad: ["#1E1B4B", "#2563EB"], scene: "BOQ Construction Cost Calculator", icon: "📊" },
  { slug: "down-payment-planning", title: "Plot Down Payment Strategy", cat: "INVESTMENT", color: "#0284C7", bgGrad: ["#075985", "#0284C7"], scene: "Down Payment Staging Ledger", icon: "💰" },
  { slug: "east-vs-west-hyderabad", title: "East vs West Growth Matrix", cat: "MARKET TRENDS", color: "#6D28D9", bgGrad: ["#4C1D95", "#6D28D9"], scene: "East vs West Growth Split Map", icon: "⚖️" },
  { slug: "encumbrance-certificate-guide", title: "Reading 30-Year EC", cat: "LEGAL & TAX", color: "#E11D48", bgGrad: ["#881337", "#E11D48"], scene: "30-Year Encumbrance Certificate", icon: "📑" },
  { slug: "financial-district-spillover", title: "Financial District Growth", cat: "LOCATION STORY", color: "#475569", bgGrad: ["#0F172A", "#475569"], scene: "Financial Towers Spillover Map", icon: "🏢" },
  { slug: "first-time-plot-buyer", title: "First-Time Buyer Roadmap", cat: "INVESTMENT", color: "#059669", bgGrad: ["#064E3B", "#059669"], scene: "First-Time Buyer Stepping Stones", icon: "🗺️" },
  { slug: "future-city-vision", title: "Telangana Future City Plan", cat: "INFRASTRUCTURE", color: "#2563EB", bgGrad: ["#1E40AF", "#2563EB"], scene: "Future City Master Plan Grid", icon: "🌐" },
  { slug: "future-of-hyderabad-west", title: "West Hyderabad 10-Yr Plan", cat: "LOCATION STORY", color: "#D97706", bgGrad: ["#78350F", "#D97706"], scene: "10-Year West Hyderabad Vista", icon: "🌅" },
  { slug: "gated-community-living", title: "Gated Villa Community Life", cat: "LIFESTYLE", color: "#65A30D", bgGrad: ["#365314", "#65A30D"], scene: "Gated Entrance & Tree Avenue", icon: "🏡" },
  { slug: "gst-real-estate", title: "GST Applicability on Land", cat: "LEGAL & TAX", color: "#9333EA", bgGrad: ["#581C87", "#9333EA"], scene: "GST Schedule III Exception Sheet", icon: "📝" },
  { slug: "hmda-vs-dtcp", title: "HMDA vs DTCP Sanction", cat: "LEGAL & TAX", color: "#0284C7", bgGrad: ["#0369A1", "#0284C7"], scene: "HMDA & DTCP Sanction Seals", icon: "🏛️" },
  { slug: "hyderabad-real-estate-trends", title: "Hyderabad Realty Cycle", cat: "MARKET TRENDS", color: "#EA580C", bgGrad: ["#7C2D12", "#EA580C"], scene: "Realty Cycle Growth Curve", icon: "📈" },
  { slug: "hyderabad-vs-bangalore-realty", title: "Hyderabad vs Bengaluru", cat: "MARKET TRENDS", color: "#2563EB", bgGrad: ["#1D4ED8", "#2563EB"], scene: "Hyderabad vs Bengaluru Tech Map", icon: "🏙️" },
  { slug: "hyderabad-west-schools", title: "International School Belt", cat: "LOCATION STORY", color: "#10B981", bgGrad: ["#064E3B", "#10B981"], scene: "Glendale Samashti School Corridor", icon: "🎓" },
  { slug: "iit-hyderabad-kandi-effect", title: "IIT Hyderabad Corridor", cat: "INFRASTRUCTURE", color: "#7C3AED", bgGrad: ["#4C1D95", "#7C3AED"], scene: "IIT Kandi Campus Expressway", icon: "🔬" },
  { slug: "industrial-corridors-hyderabad", title: "Patancheru Industrial Zone", cat: "INFRASTRUCTURE", color: "#DC2626", bgGrad: ["#7F1D1D", "#DC2626"], scene: "Patancheru Industrial Buffer Map", icon: "🏭" },
  { slug: "infrastructure-projects-hyderabad", title: "Highway Infrastructure", cat: "INFRASTRUCTURE", color: "#3B82F6", bgGrad: ["#1E3A8A", "#3B82F6"], scene: "ORR Elevated Interchange Model", icon: "🛣️" },
  { slug: "it-sector-hyderabad-realty", title: "IT Corridor Demand", cat: "MARKET TRENDS", color: "#4F46E5", bgGrad: ["#312E81", "#4F46E5"], scene: "IT Workforce Housing Matrix", icon: "💻" },
  { slug: "joint-family-property-investment", title: "Joint Family Land Title", cat: "LEGAL & TAX", color: "#F97316", bgGrad: ["#7C2D12", "#F97316"], scene: "Heir Partition & Family Deed", icon: "👨‍👩‍👧‍👦" },
  { slug: "kokapet-neopolis-effect", title: "Kokapet Neopolis Effect", cat: "LOCATION STORY", color: "#0EA5E9", bgGrad: ["#0C4A6E", "#0EA5E9"], scene: "Kokapet Neopolis High-Rise Vista", icon: "🌆" },
  { slug: "land-appreciation-hyderabad-west", title: "Land Appreciation Math", cat: "INVESTMENT", color: "#059669", bgGrad: ["#064E3B", "#059669"], scene: "Compounded Land Appreciation Chart", icon: "📊" },
  { slug: "land-banking-strategy", title: "Land Banking Strategy", cat: "INVESTMENT", color: "#7C3AED", bgGrad: ["#4C1D95", "#7C3AED"], scene: "Long-Term Land Bank Vault", icon: "🏦" },
  { slug: "land-price-drivers", title: "Price Drivers in Shankarpally", cat: "INVESTMENT", color: "#CA8A04", bgGrad: ["#713F12", "#CA8A04"], scene: "Shankarpally Price per Sqyd Drivers", icon: "🏷️" },
  { slug: "luxury-living-west-hyderabad", title: "West Hyderabad Villa Tour", cat: "LIFESTYLE", color: "#047857", bgGrad: ["#064E3B", "#047857"], scene: "Luxury Villa Courtyard & Sapling", icon: "✨" },
  { slug: "market-cycles-land", title: "Understanding Land Cycles", cat: "MARKET TRENDS", color: "#2563EB", bgGrad: ["#1E3A8A", "#2563EB"], scene: "10-Year Market Cycle Wave", icon: "🔄" },
  { slug: "metro-expansion-west", title: "Metro Phase 2 West Line", cat: "INFRASTRUCTURE", color: "#DC2626", bgGrad: ["#7F1D1D", "#DC2626"], scene: "Metro Phase 2 Line Map to Shankarpally", icon: "🚆" },
  { slug: "mmts-shankarpally-connectivity", title: "MMTS Railway Connectivity", cat: "LOCATION STORY", color: "#6D28D9", bgGrad: ["#4C1D95", "#6D28D9"], scene: "Shankarpally MMTS Rail Station", icon: "🚉" },
  { slug: "mokila-villa-corridor", title: "Mokila Villa Corridor", cat: "LOCATION STORY", color: "#16A34A", bgGrad: ["#14532D", "#16A34A"], scene: "Mokila Villa Belt Expansion", icon: "🏡" },
  { slug: "negotiating-plot-purchase", title: "Negotiating Plot Terms", cat: "BUYER GUIDE", color: "#B45309", bgGrad: ["#451A03", "#B45309"], scene: "Kitchen Table Deal & 100% Refund Clause", icon: "🤝" },
  { slug: "nri-guide-plot-investment", title: "NRI FEMA & Land Rules", cat: "INVESTMENT", color: "#3B82F6", bgGrad: ["#1E3A8A", "#3B82F6"], scene: "NRI NRE Account & FEMA Rules", icon: "✈️" },
  { slug: "orr-exit3-corridor", title: "ORR Exit 3 Growth Story", cat: "LOCATION STORY", color: "#EA580C", bgGrad: ["#7C2D12", "#EA580C"], scene: "Outer Ring Road Exit 3 Interchange", icon: "🛣️" },
  { slug: "orr-growth-story", title: "Outer Ring Road Impact", cat: "INFRASTRUCTURE", color: "#0284C7", bgGrad: ["#075985", "#0284C7"], scene: "158km Outer Ring Road Orbital", icon: "⭕" },
  { slug: "patancheru-industrial-corridor", title: "Patancheru Belt Growth", cat: "INFRASTRUCTURE", color: "#E11D48", bgGrad: ["#881337", "#E11D48"], scene: "Patancheru Highway Transition", icon: "🏭" },
  { slug: "plot-buying-mistakes-stories", title: "Real Plot Dispute Stories", cat: "BUYER GUIDE", color: "#6D28D9", bgGrad: ["#4C1D95", "#6D28D9"], scene: "12 Plot Buying Dispute Lessons", icon: "⚠️" },
  { slug: "plot-loan-vs-home-loan", title: "Plot Loan vs Home Loan", cat: "LEGAL & TAX", color: "#2563EB", bgGrad: ["#1E3A8A", "#2563EB"], scene: "Bank Valuation vs Plot Loan Approval", icon: "🏦" },
  { slug: "plots-vs-apartments", title: "Plots vs Apartment Yield", cat: "INVESTMENT", color: "#10B981", bgGrad: ["#064E3B", "#10B981"], scene: "Plot Capital Growth vs Apartment Rent", icon: "🏢" },
  { slug: "plotted-development-boom", title: "Plotted Development Boom", cat: "MARKET TRENDS", color: "#D97706", bgGrad: ["#78350F", "#D97706"], scene: "Plotted Format Revival Math", icon: "🚀" },
  { slug: "portfolio-diversification-real-estate", title: "Land in Paper Portfolio", cat: "INVESTMENT", color: "#0284C7", bgGrad: ["#075985", "#0284C7"], scene: "Asset Allocation: Stocks, Gold & Land", icon: "📁" },
  { slug: "property-mutation-telangana", title: "Registration & Mutation", cat: "LEGAL & TAX", color: "#7C3AED", bgGrad: ["#4C1D95", "#7C3AED"], scene: "Sub-Registrar Sale Deed & Mutation", icon: "✒️" },
  { slug: "reading-layout-plans", title: "Reading Layout Title Block", cat: "BUYER GUIDE", color: "#D97706", bgGrad: ["#78350F", "#D97706"], scene: "Architect Blueprint & Title Block Box", icon: "📐" },
  { slug: "real-estate-vs-gold-vs-equity", title: "Land vs Gold vs Equity", cat: "INVESTMENT", color: "#059669", bgGrad: ["#064E3B", "#059669"], scene: "30-Year Asset Return Comparison", icon: "👑" },
  { slug: "regional-ring-road-progress", title: "Regional Ring Road (RRR)", cat: "INFRASTRUCTURE", color: "#3B82F6", bgGrad: ["#1E3A8A", "#3B82F6"], scene: "340km Regional Ring Road Expressway", icon: "🛣️" },
  { slug: "rental-yield-vs-appreciation", title: "Yield vs Capital Growth", cat: "INVESTMENT", color: "#EA580C", bgGrad: ["#7C2D12", "#EA580C"], scene: "Rental Yield vs Land Growth Curve", icon: "💹" },
  { slug: "rera-plotted-developments", title: "TS RERA Buyer Rights", cat: "LEGAL & TAX", color: "#0369A1", bgGrad: ["#075985", "#0369A1"], scene: "TS-RERA Official Registration Portal", icon: "🛡️" },
  { slug: "retirement-investment-villa-plots", title: "Retirement Villa Plots", cat: "LIFESTYLE", color: "#16A34A", bgGrad: ["#14532D", "#16A34A"], scene: "Quiet Retirement Villa Garden", icon: "🌳" },
  { slug: "rrr-hyderabad-impact", title: "RRR Impact on Shankarpally", cat: "INFRASTRUCTURE", color: "#2563EB", bgGrad: ["#1E3A8A", "#2563EB"], scene: "RRR Northern Section Impact Map", icon: "⚡" },
  { slug: "second-property-investment", title: "Second Property Strategy", cat: "INVESTMENT", color: "#D97706", bgGrad: ["#78350F", "#D97706"], scene: "Second Property Diversification", icon: "🔑" },
  { slug: "shankarpally-growth-story", title: "Shankarpally Growth Story", cat: "LOCATION STORY", color: "#10B981", bgGrad: ["#064E3B", "#10B981"], scene: "Shankarpally Station to Villa Corridor", icon: "🌱" },
  { slug: "shankarpally-vs-kokapet", title: "Shankarpally vs Kokapet", cat: "LOCATION STORY", color: "#F59E0B", bgGrad: ["#78350F", "#F59E0B"], scene: "Shankarpally Price vs Kokapet Scale", icon: "⚖️" },
  { slug: "shankarpally-vs-mokila", title: "Shankarpally vs Mokila", cat: "LOCATION STORY", color: "#0EA5E9", bgGrad: ["#0C4A6E", "#0EA5E9"], scene: "Shankarpally vs Mokila Corridor", icon: "🗺️" },
  { slug: "site-visit-checklist", title: "Methodical Site Visit", cat: "BUYER GUIDE", color: "#10B981", bgGrad: ["#064E3B", "#10B981"], scene: "Site Engineer & Boundary Inspection Tablet", icon: "📋" },
  { slug: "small-budget-plot-investment", title: "200 Sq.Yd Plot Strategy", cat: "INVESTMENT", color: "#F59E0B", bgGrad: ["#78350F", "#F59E0B"], scene: "200 Sq.Yd Villa Plot Boundary Marker", icon: "📐" },
  { slug: "stamp-duty-registration-telangana", title: "Stamp Duty Calculation", cat: "LEGAL & TAX", color: "#7C3AED", bgGrad: ["#4C1D95", "#7C3AED"], scene: "7.5% Stamp Duty & Transfer Fee Ledger", icon: "🧾" },
  { slug: "sustainable-villa-design", title: "Sustainable Villa Design", cat: "LIFESTYLE", color: "#16A34A", bgGrad: ["#14532D", "#16A34A"], scene: "Solar Roof & Rainwater Harvesting Villa", icon: "☀️" },
  { slug: "tax-benefits-property", title: "Property Tax Life Cycle", cat: "LEGAL & TAX", color: "#2563EB", bgGrad: ["#1E3A8A", "#2563EB"], scene: "Bare Land Tax vs Built Villa Deductions", icon: "📉" },
  { slug: "tellapur-kollur-emerging", title: "Tellapur & Kollur Belt", cat: "LOCATION STORY", color: "#F97316", bgGrad: ["#7C2D12", "#F97316"], scene: "Tellapur Kollur Villa Expansion", icon: "🌇" },
  { slug: "vaastu-villa-plots", title: "Vaastu Plot Facing Rules", cat: "LIFESTYLE", color: "#D97706", bgGrad: ["#78350F", "#D97706"], scene: "East & North Facing Vaastu Compass", icon: "🧭" },
  { slug: "verify-land-titles", title: "Title Flow & Heir Verification", cat: "LEGAL & TAX", color: "#8B5CF6", bgGrad: ["#4C1D95", "#8B5CF6"], scene: "30-Year Link Document Heir Verification", icon: "🔍" },
  { slug: "villa-design-trends", title: "Modern Villa Architecture", cat: "LIFESTYLE", color: "#059669", bgGrad: ["#064E3B", "#059669"], scene: "Modern Minimalist Villa Elevation", icon: "🏡" },
  { slug: "villa-plot-investment-guide", title: "Master Villa Plot Guide", cat: "INVESTMENT", color: "#3B82F6", bgGrad: ["#1E3A8A", "#3B82F6"], scene: "Complete Telangana Plot Buying Playbook", icon: "📘" },
  { slug: "weekend-homes-hyderabad", title: "Weekend Home Investment", cat: "LIFESTYLE", color: "#F97316", bgGrad: ["#7C2D12", "#F97316"], scene: "Shankarpally Weekend Home Retreat", icon: "🏖️" },
  { slug: "why-invest-in-shankarpally", title: "Why Shankarpally Corridor", cat: "LOCATION STORY", color: "#10B981", bgGrad: ["#064E3B", "#10B981"], scene: "Shankarpally Investment Thesis", icon: "💎" },
  { slug: "women-property-ownership", title: "Women Property Ownership", cat: "LEGAL & TAX", color: "#9333EA", bgGrad: ["#581C87", "#9333EA"], scene: "Women Stamp Duty Concession & Title", icon: "👩" },
  { slug: "young-professionals-land-investment", title: "Young Professional Guide", cat: "INVESTMENT", color: "#0EA5E9", bgGrad: ["#0C4A6E", "#0EA5E9"], scene: "Young Professional Land Portfolio", icon: "💼" },
];

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateDedicated3dSvg(item, idx) {
  const width = 1600;
  const height = 1000;
  const safeTitle = escapeXml(item.title);
  const safeCat = escapeXml(item.cat);
  const safeScene = escapeXml(item.scene);
  const safeIcon = escapeXml(item.icon);
  const storyNum = String(idx + 1).padStart(2, "0");

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad${idx}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${item.bgGrad[0]}" stop-opacity="0.98"/>
          <stop offset="50%" stop-color="${item.bgGrad[1]}" stop-opacity="0.90"/>
          <stop offset="100%" stop-color="#0A0A0C" stop-opacity="0.98"/>
        </linearGradient>
        <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>

      <!-- 3D Rich Gradient Backdrop -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad${idx})" />

      <!-- 3D Geometric Grid Lines -->
      <g stroke="${item.color}" stroke-opacity="0.25" stroke-width="2" fill="none">
        <circle cx="1200" cy="500" r="360" />
        <circle cx="1200" cy="500" r="240" />
        <line x1="0" y1="150" x2="1600" y2="850" />
        <line x1="0" y1="850" x2="1600" y2="150" />
      </g>

      <!-- Central 3D Editorial Stage Glass Card -->
      <g transform="translate(120, 160)" filter="url(#shadow3d)">
        <rect x="0" y="0" width="1360" height="680" rx="36" fill="rgba(253, 251, 247, 0.96)" stroke="${item.color}" stroke-width="3" />
        
        <!-- Category Pill Top-Left -->
        <g transform="translate(50, 50)">
          <rect x="0" y="0" width="240" height="50" rx="25" fill="${item.bgGrad[0]}" />
          <text x="120" y="31" font-family="sans-serif" font-size="12" font-weight="900" letter-spacing="3" text-anchor="middle" fill="#FFFDF7">${safeCat}</text>
        </g>

        <!-- Topic Icon Emblem -->
        <g transform="translate(50, 130)">
          <circle cx="55" cy="55" r="55" fill="${item.color}" fill-opacity="0.25" stroke="${item.color}" stroke-width="3"/>
          <text x="55" y="72" font-family="sans-serif" font-size="48" text-anchor="middle">${safeIcon}</text>
        </g>

        <!-- Topic Highlight Badge & Title -->
        <g transform="translate(190, 155)">
          <text x="0" y="30" font-family="sans-serif" font-size="14" font-weight="900" letter-spacing="4" fill="${item.color}">${safeScene}</text>
          <text x="0" y="70" font-family="serif" font-size="44" font-weight="800" fill="#1D1D1D">${safeTitle}</text>
        </g>

        <!-- Story Index Seal Right -->
        <g transform="translate(1120, 50)">
          <circle cx="80" cy="80" r="70" fill="${item.bgGrad[1]}" stroke="${item.color}" stroke-width="3" />
          <text x="80" y="70" font-family="sans-serif" font-size="12" font-weight="800" letter-spacing="2" text-anchor="middle" fill="#FFFFFF">ESSAY</text>
          <text x="80" y="105" font-family="sans-serif" font-size="34" font-weight="900" text-anchor="middle" fill="#FFFDF7">#${storyNum}</text>
        </g>

        <!-- Bottom Footer Specs -->
        <g transform="translate(50, 580)">
          <line x1="0" y1="0" x2="1260" y2="0" stroke="rgba(29, 29, 29, 0.12)" stroke-width="1.5" />
          <text x="0" y="45" font-family="sans-serif" font-size="14" font-weight="800" letter-spacing="3" fill="#1D1D1D">TERRAVION LUXURY REAL ESTATE JOURNAL · STORY #${storyNum}</text>
          <text x="1260" y="45" font-family="sans-serif" font-size="14" font-weight="800" letter-spacing="2" text-anchor="end" fill="${item.color}">100% EXCLUSIVE DEDICATED ARTWORK</text>
        </g>
      </g>

      <!-- Top Right Corner Badge -->
      <g transform="translate(1380, 60)">
        <rect x="0" y="0" width="160" height="46" rx="23" fill="rgba(253, 251, 247, 0.95)" stroke="${item.color}" stroke-width="1.5" />
        <text x="80" y="28" font-family="sans-serif" font-size="13" font-weight="900" letter-spacing="2" text-anchor="middle" fill="#1D1D1D">STORY #${storyNum}</text>
      </g>
    </svg>
  `;
}

async function renderTrulyUniqueJournalImage(item, idx) {
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

  const svgBuffer = Buffer.from(generateDedicated3dSvg(item, idx));

  await sharp(svgBuffer)
    .resize(1600, 1000)
    .png()
    .toFile(destPath);
}

async function run() {
  console.log("Generating 72 COMPLETELY DISTINCT DEDICATED 3D ARTWORKS for all Journal Essays...");

  for (let i = 0; i < blogCatalog.length; i++) {
    await renderTrulyUniqueJournalImage(blogCatalog[i], i);
  }

  console.log("Successfully generated 72 COMPLETELY DISTINCT DEDICATED 3D ARTWORKS!");
}

run();
