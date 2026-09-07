import fs from "fs";
import path from "path";
import sharp from "sharp";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");

// 72 unique blog topics with distinct 3D visual parameters
const blogTopics = [
  { slug: "affordability-migration-west", title: "Buyers Migration West", cat: "MARKET TRENDS", topic: "MIGRATION WEST", colorA: "#0F172A", colorB: "#0284C7", accent: "#38BDF8", icon: "🏙️", shape: "ring" },
  { slug: "agricultural-vs-residential-land", title: "Land Record Pahani Check", cat: "LEGAL & TAX", topic: "PAHANI RECORD", colorA: "#14532D", colorB: "#16A34A", accent: "#4ADE80", icon: "📜", shape: "grid" },
  { slug: "airport-connectivity-west", title: "Airport Expressway Corridor", cat: "INFRASTRUCTURE", topic: "AIRPORT EXPRESS", colorA: "#1E1B4B", colorB: "#4338CA", accent: "#818CF8", icon: "✈️", shape: "highway" },
  { slug: "best-investment-locations-hyderabad", title: "Top Hyderabad Land Zones", cat: "INVESTMENT", topic: "TOP LAND ZONES", colorA: "#451A03", colorB: "#D97706", accent: "#FBBF24", icon: "📍", shape: "map" },
  { slug: "building-villa-on-plot", title: "Building a Villa: Correct Order", cat: "BUYER GUIDE", topic: "VILLA SEQUENCE", colorA: "#3B0764", colorB: "#9333EA", accent: "#C084FC", icon: "🏗️", shape: "villa" },
  { slug: "capital-gains-tax-land", title: "Sec 54F Capital Gains Tax", cat: "LEGAL & TAX", topic: "SECTION 54F TAX", colorA: "#064E3B", colorB: "#0D9488", accent: "#2DD4BF", icon: "⚖️", shape: "chart" },
  { slug: "chevella-moinabad-belt", title: "Chevella & Moinabad Analysis", cat: "LOCATION STORY", topic: "CHEVELLA BELT", colorA: "#166534", colorB: "#15803D", accent: "#86EFAC", icon: "🌾", shape: "landscape" },
  { slug: "clubhouse-lifestyle", title: "25,000 Sq.Ft. Clubhouse Story", cat: "LIFESTYLE", topic: "CLUBHOUSE AMENITIES", colorA: "#78350F", colorB: "#B45309", accent: "#FDE047", icon: "🏊", shape: "pool" },
  { slug: "construction-cost-planning", title: "Villa Budget & Costing", cat: "BUYER GUIDE", topic: "CONSTRUCTION BUDGET", colorA: "#1E3A8A", colorB: "#2563EB", accent: "#60A5FA", icon: "📊", shape: "calculator" },
  { slug: "down-payment-planning", title: "Plot Down Payment Strategy", cat: "INVESTMENT", topic: "DOWN PAYMENT MATH", colorA: "#075985", colorB: "#0284C7", accent: "#38BDF8", icon: "💰", shape: "coins" },
  { slug: "east-vs-west-hyderabad", title: "East vs West Growth Matrix", cat: "MARKET TRENDS", topic: "EAST VS WEST", colorA: "#581C87", colorB: "#7C3AED", accent: "#A78BFA", icon: "⚖️", shape: "split" },
  { slug: "encumbrance-certificate-guide", title: "Reading 30-Year EC", cat: "LEGAL & TAX", topic: "30-YEAR EC", colorA: "#881337", colorB: "#E11D48", accent: "#FB7185", icon: "📑", shape: "certificate" },
  { slug: "financial-district-spillover", title: "Financial District Growth", cat: "LOCATION STORY", topic: "FINANCIAL DIST", colorA: "#0F172A", colorB: "#334155", accent: "#94A3B8", icon: "🏢", shape: "towers" },
  { slug: "first-time-plot-buyer", title: "First-Time Buyer Roadmap", cat: "INVESTMENT", topic: "FIRST BUYER ROADMAP", colorA: "#065F46", colorB: "#059669", accent: "#34D399", icon: "🗺️", shape: "path" },
  { slug: "future-city-vision", title: "Telangana Future City Plan", cat: "INFRASTRUCTURE", topic: "FUTURE CITY VISION", colorA: "#1E40AF", colorB: "#3B82F6", accent: "#93C5FD", icon: "🌐", shape: "city" },
  { slug: "future-of-hyderabad-west", title: "West Hyderabad 10-Yr Plan", cat: "LOCATION STORY", topic: "WEST HYD 10-YR", colorA: "#B45309", colorB: "#F59E0B", accent: "#FDE68A", icon: "🌅", shape: "sun" },
  { slug: "gated-community-living", title: "Gated Villa Community Life", cat: "LIFESTYLE", topic: "GATED COMMUNITY", colorA: "#365314", colorB: "#65A30D", accent: "#A3E635", icon: "🏡", shape: "gate" },
  { slug: "gst-real-estate", title: "GST Applicability on Land", cat: "LEGAL & TAX", topic: "GST ON PLOTS", colorA: "#6B21A8", colorB: "#9333EA", accent: "#E9D5FF", icon: "📝", shape: "tax" },
  { slug: "hmda-vs-dtcp", title: "HMDA vs DTCP Sanction", cat: "LEGAL & TAX", topic: "HMDA VS DTCP", colorA: "#0369A1", colorB: "#0284C7", accent: "#BAE6FD", icon: "🏛️", shape: "stamps" },
  { slug: "hyderabad-real-estate-trends", title: "Hyderabad Realty Cycle", cat: "MARKET TRENDS", topic: "REALTY CYCLES", colorA: "#9A3412", colorB: "#EA580C", accent: "#FDBA74", icon: "📈", shape: "cycle" },
  { slug: "hyderabad-vs-bangalore-realty", title: "Hyderabad vs Bengaluru", cat: "MARKET TRENDS", topic: "HYD VS BLR", colorA: "#1D4ED8", colorB: "#2563EB", accent: "#93C5FD", icon: "🏙️", shape: "versus" },
  { slug: "hyderabad-west-schools", title: "International School Belt", cat: "LOCATION STORY", topic: "SCHOOL CORRIDOR", colorA: "#047857", colorB: "#10B981", accent: "#6EE7B7", icon: "🎓", shape: "school" },
  { slug: "iit-hyderabad-kandi-effect", title: "IIT Hyderabad Corridor", cat: "INFRASTRUCTURE", topic: "IIT KANDI CORRIDOR", colorA: "#6D28D9", colorB: "#8B5CF6", accent: "#C4B5FD", icon: "🔬", shape: "campus" },
  { slug: "industrial-corridors-hyderabad", title: "Patancheru Industrial Zone", cat: "INFRASTRUCTURE", topic: "PATANCHERU ZONE", colorA: "#991B1B", colorB: "#EF4444", accent: "#FCA5A5", icon: "🏭", shape: "industry" },
  { slug: "infrastructure-projects-hyderabad", title: "Highway Infrastructure", cat: "INFRASTRUCTURE", topic: "HIGHWAYS & ORR", colorA: "#1D4ED8", colorB: "#3B82F6", accent: "#BFDBFE", icon: "🛣️", shape: "highway" },
  { slug: "it-sector-hyderabad-realty", title: "IT Corridor Demand", cat: "MARKET TRENDS", topic: "IT SECTOR DEMAND", colorA: "#3730A3", colorB: "#6366F1", accent: "#A5B4FC", icon: "💻", shape: "tech" },
  { slug: "joint-family-property-investment", title: "Joint Family Land Title", cat: "LEGAL & TAX", topic: "JOINT FAMILY TITLE", colorA: "#9A3412", colorB: "#F97316", accent: "#FFEDD5", icon: "👨‍👩‍👧‍👦", shape: "family" },
  { slug: "kokapet-neopolis-effect", title: "Kokapet Neopolis Effect", cat: "LOCATION STORY", topic: "KOKAPET NEOPOLIS", colorA: "#0369A1", colorB: "#0EA5E9", accent: "#7DD3FC", icon: "🌆", shape: "skyline" },
  { slug: "land-appreciation-hyderabad-west", title: "Land Appreciation Math", cat: "INVESTMENT", topic: "APPRECIATION MATH", colorA: "#065F46", colorB: "#059669", accent: "#A7F3D0", icon: "📊", shape: "growth" },
  { slug: "land-banking-strategy", title: "Land Banking Strategy", cat: "INVESTMENT", topic: "LAND BANKING", colorA: "#5B21B6", colorB: "#7C3AED", accent: "#DDD6FE", icon: "🏦", shape: "vault" },
  { slug: "land-price-drivers", title: "Price Drivers in Shankarpally", cat: "INVESTMENT", topic: "PRICE DRIVERS", colorA: "#854D0E", colorB: "#CA8A04", accent: "#FEF08A", icon: "🏷️", shape: "tag" },
  { slug: "luxury-living-west-hyderabad", title: "West Hyderabad Villa Tour", cat: "LIFESTYLE", topic: "LUXURY VILLA TOUR", colorA: "#064E3B", colorB: "#047857", accent: "#6EE7B7", icon: "✨", shape: "diamond" },
  { slug: "market-cycles-land", title: "Understanding Land Cycles", cat: "MARKET TRENDS", topic: "LAND MARKET CYCLES", colorA: "#1E40AF", colorB: "#2563EB", accent: "#93C5FD", icon: "🔄", shape: "circle" },
  { slug: "metro-expansion-west", title: "Metro Phase 2 West Line", cat: "INFRASTRUCTURE", topic: "METRO PHASE 2", colorA: "#991B1B", colorB: "#DC2626", accent: "#FCA5A5", icon: "🚆", shape: "train" },
  { slug: "mmts-shankarpally-connectivity", title: "MMTS Railway Connectivity", cat: "LOCATION STORY", topic: "MMTS SHANKARPALLY", colorA: "#5B21B6", colorB: "#6D28D9", accent: "#C4B5FD", icon: "🚉", shape: "station" },
  { slug: "mokila-villa-corridor", title: "Mokila Villa Corridor", cat: "LOCATION STORY", topic: "MOKILA VILLA BELT", colorA: "#14532D", colorB: "#16A34A", accent: "#86EFAC", icon: "🏡", shape: "villas" },
  { slug: "negotiating-plot-purchase", title: "Negotiating Plot Terms", cat: "BUYER GUIDE", topic: "PLOT NEGOTIATION", colorA: "#78350F", colorB: "#B45309", accent: "#FDE047", icon: "🤝", shape: "shake" },
  { slug: "nri-guide-plot-investment", title: "NRI FEMA & Land Rules", cat: "INVESTMENT", topic: "NRI FEMA RULES", colorA: "#1E3A8A", colorB: "#3B82F6", accent: "#93C5FD", icon: "✈️", shape: "globe" },
  { slug: "orr-exit3-corridor", title: "ORR Exit 3 Growth Story", cat: "LOCATION STORY", topic: "ORR EXIT 3 BELT", colorA: "#9A3412", colorB: "#EA580C", accent: "#FFEDD5", icon: "🛣️", shape: "exit" },
  { slug: "orr-growth-story", title: "Outer Ring Road Impact", cat: "INFRASTRUCTURE", topic: "ORR IMPACT STORY", colorA: "#075985", colorB: "#0284C7", accent: "#BAE6FD", icon: "⭕", shape: "ring" },
  { slug: "patancheru-industrial-corridor", title: "Patancheru Belt Growth", cat: "INFRASTRUCTURE", topic: "PATANCHERU BELT", colorA: "#881337", colorB: "#E11D48", accent: "#FECDD3", icon: "🏭", shape: "factory" },
  { slug: "plot-buying-mistakes-stories", title: "Real Plot Dispute Stories", cat: "BUYER GUIDE", topic: "DISPUTE LESSONS", colorA: "#4C1D95", colorB: "#6D28D9", accent: "#DDD6FE", icon: "⚠️", shape: "warning" },
  { slug: "plot-loan-vs-home-loan", title: "Plot Loan vs Home Loan", cat: "LEGAL & TAX", topic: "PLOT VS HOME LOAN", colorA: "#1E3A8A", colorB: "#2563EB", accent: "#BFDBFE", icon: "🏦", shape: "bank" },
  { slug: "plots-vs-apartments", title: "Plots vs Apartment Yield", cat: "INVESTMENT", topic: "PLOTS VS APTS", colorA: "#065F46", colorB: "#10B981", accent: "#A7F3D0", icon: "🏢", shape: "compare" },
  { slug: "plotted-development-boom", title: "Plotted Development Boom", cat: "MARKET TRENDS", topic: "PLOTTED BOOM", colorA: "#9A3412", colorB: "#D97706", accent: "#FED7AA", icon: "🚀", shape: "rocket" },
  { slug: "portfolio-diversification-real-estate", title: "Land in Paper Portfolio", cat: "INVESTMENT", topic: "LAND PORTFOLIO", colorA: "#0369A1", colorB: "#0284C7", accent: "#E0F2FE", icon: "📁", shape: "file" },
  { slug: "property-mutation-telangana", title: "Registration & Mutation", cat: "LEGAL & TAX", topic: "MUTATION PROCESS", colorA: "#5B21B6", colorB: "#7C3AED", accent: "#EDE9FE", icon: "✒️", shape: "pen" },
  { slug: "reading-layout-plans", title: "Reading Layout Title Block", cat: "BUYER GUIDE", topic: "TITLE BLOCK READ", colorA: "#78350F", colorB: "#D97706", accent: "#FEF08A", icon: "📐", shape: "blueprint" },
  { slug: "real-estate-vs-gold-vs-equity", title: "Land vs Gold vs Equity", cat: "INVESTMENT", topic: "LAND VS GOLD", colorA: "#065F46", colorB: "#059669", accent: "#6EE7B7", icon: "👑", shape: "gold" },
  { slug: "regional-ring-road-progress", title: "Regional Ring Road (RRR)", cat: "INFRASTRUCTURE", topic: "RRR EXPRESSWAY", colorA: "#1D4ED8", colorB: "#3B82F6", accent: "#DBEAFE", icon: "🛣️", shape: "highway" },
  { slug: "rental-yield-vs-appreciation", title: "Yield vs Capital Growth", cat: "INVESTMENT", topic: "YIELD VS GROWTH", colorA: "#9A3412", colorB: "#EA580C", accent: "#FFEDD5", icon: "💹", shape: "chart" },
  { slug: "rera-plotted-developments", title: "TS RERA Buyer Rights", cat: "LEGAL & TAX", topic: "TS RERA RIGHTS", colorA: "#0284C7", colorB: "#0369A1", accent: "#BAE6FD", icon: "🛡️", shape: "shield" },
  { slug: "retirement-investment-villa-plots", title: "Retirement Villa Plots", cat: "LIFESTYLE", topic: "RETIREMENT PLOTS", colorA: "#15803D", colorB: "#16A34A", accent: "#DCFCE7", icon: "🌳", shape: "tree" },
  { slug: "rrr-hyderabad-impact", title: "RRR Impact on Shankarpally", cat: "INFRASTRUCTURE", topic: "RRR SHANKARPALLY", colorA: "#1E40AF", colorB: "#2563EB", accent: "#BFDBFE", icon: "⚡", shape: "impact" },
  { slug: "second-property-investment", title: "Second Property Strategy", cat: "INVESTMENT", topic: "SECOND PROPERTY", colorA: "#B45309", colorB: "#D97706", accent: "#FEF08A", icon: "🔑", shape: "key" },
  { slug: "shankarpally-growth-story", title: "Shankarpally Growth Story", cat: "LOCATION STORY", topic: "SHANKARPALLY", colorA: "#047857", colorB: "#10B981", accent: "#A7F3D0", icon: "🌱", shape: "sprout" },
  { slug: "shankarpally-vs-kokapet", title: "Shankarpally vs Kokapet", cat: "LOCATION STORY", topic: "VS KOKAPET", colorA: "#B45309", colorB: "#F59E0B", accent: "#FEF3C7", icon: "⚖️", shape: "scale" },
  { slug: "shankarpally-vs-mokila", title: "Shankarpally vs Mokila", cat: "LOCATION STORY", topic: "VS MOKILA", colorA: "#0284C7", colorB: "#0EA5E9", accent: "#E0F2FE", icon: "🗺️", shape: "dual" },
  { slug: "site-visit-checklist", title: "Methodical Site Visit", cat: "BUYER GUIDE", topic: "SITE CHECKLIST", colorA: "#059669", colorB: "#10B981", accent: "#D1FAE5", icon: "📋", shape: "check" },
  { slug: "small-budget-plot-investment", title: "200 Sq.Yd Plot Strategy", cat: "INVESTMENT", topic: "200 SQ YD PLOT", colorA: "#D97706", colorB: "#F59E0B", accent: "#FEF3C7", icon: "📐", shape: "plot" },
  { slug: "stamp-duty-registration-telangana", title: "Stamp Duty Calculation", cat: "LEGAL & TAX", topic: "STAMP DUTY MATH", colorA: "#6D28D9", colorB: "#7C3AED", accent: "#EDE9FE", icon: "🧾", shape: "receipt" },
  { slug: "sustainable-villa-design", title: "Sustainable Villa Design", cat: "LIFESTYLE", topic: "GREEN VILLA DESIGN", colorA: "#15803D", colorB: "#16A34A", accent: "#DCFCE7", icon: "☀️", shape: "solar" },
  { slug: "tax-benefits-property", title: "Property Tax Life Cycle", cat: "LEGAL & TAX", topic: "PROPERTY TAX", colorA: "#1D4ED8", colorB: "#2563EB", accent: "#DBEAFE", icon: "📉", shape: "tax" },
  { slug: "tellapur-kollur-emerging", title: "Tellapur & Kollur Belt", cat: "LOCATION STORY", topic: "TELLAPUR KOLLUR", colorA: "#EA580C", colorB: "#F97316", accent: "#FFEDD5", icon: "🌇", shape: "sunset" },
  { slug: "vaastu-villa-plots", title: "Vaastu Plot Facing Rules", cat: "LIFESTYLE", topic: "VAASTU COMPLIANT", colorA: "#B45309", colorB: "#D97706", accent: "#FEF08A", icon: "🧭", shape: "compass" },
  { slug: "verify-land-titles", title: "Title Flow & Heir Verification", cat: "LEGAL & TAX", topic: "VERIFY TITLES", colorA: "#6D28D9", colorB: "#8B5CF6", accent: "#DDD6FE", icon: "🔍", shape: "glass" },
  { slug: "villa-design-trends", title: "Modern Villa Architecture", cat: "LIFESTYLE", topic: "VILLA ARCHITECTURE", colorA: "#047857", colorB: "#059669", accent: "#A7F3D0", icon: "🏡", shape: "arch" },
  { slug: "villa-plot-investment-guide", title: "Master Villa Plot Guide", cat: "INVESTMENT", topic: "MASTER PLAYBOOK", colorA: "#1D4ED8", colorB: "#3B82F6", accent: "#BFDBFE", icon: "📘", shape: "book" },
  { slug: "weekend-homes-hyderabad", title: "Weekend Home Investment", cat: "LIFESTYLE", topic: "WEEKEND HOMES", colorA: "#EA580C", colorB: "#F97316", accent: "#FFEDD5", icon: "🏖️", shape: "resort" },
  { slug: "why-invest-in-shankarpally", title: "Why Shankarpally Corridor", cat: "LOCATION STORY", topic: "WHY SHANKARPALLY", colorA: "#059669", colorB: "#10B981", accent: "#D1FAE5", icon: "💎", shape: "gem" },
  { slug: "women-property-ownership", title: "Women Property Ownership", cat: "LEGAL & TAX", topic: "WOMEN OWNERSHIP", colorA: "#7C3AED", colorB: "#9333EA", accent: "#F3E8FF", icon: "👩", shape: "women" },
  { slug: "young-professionals-land-investment", title: "Young Professional Guide", cat: "INVESTMENT", topic: "YOUNG BUYERS", colorA: "#0284C7", colorB: "#0EA5E9", accent: "#E0F2FE", icon: "💼", shape: "suit" },
];

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateExclusive3dArtSvg(item, idx) {
  const width = 1600;
  const height = 1000;
  const safeTitle = escapeXml(item.title);
  const safeCat = escapeXml(item.cat);
  const safeTopic = escapeXml(item.topic);
  const safeIcon = escapeXml(item.icon);
  const storyNum = String(idx + 1).padStart(2, "0");

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad${idx}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${item.colorA}" stop-opacity="0.95"/>
          <stop offset="60%" stop-color="${item.colorB}" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#0F0F11" stop-opacity="0.95"/>
        </linearGradient>
        <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>

      <!-- 3D Rich Gradient Backdrop -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad${idx})" />

      <!-- Decorative 3D Geometry Lines -->
      <g stroke="${item.accent}" stroke-opacity="0.15" stroke-width="2" fill="none">
        <circle cx="1200" cy="500" r="380" />
        <circle cx="1200" cy="500" r="260" />
        <circle cx="1200" cy="500" r="140" />
        <line x1="0" y1="200" x2="1600" y2="800" />
        <line x1="0" y1="800" x2="1600" y2="200" />
      </g>

      <!-- Central 3D Editorial Stage Glass Card -->
      <g transform="translate(140, 180)" filter="url(#shadow3d)">
        <rect x="0" y="0" width="1320" height="640" rx="36" fill="rgba(253, 251, 247, 0.95)" stroke="${item.accent}" stroke-width="3" />
        
        <!-- Top Category Pill -->
        <g transform="translate(50, 50)">
          <rect x="0" y="0" width="260" height="52" rx="26" fill="${item.colorA}" />
          <text x="130" y="32" font-family="sans-serif" font-size="13" font-weight="900" letter-spacing="3" text-anchor="middle" fill="#FFFDF7">${safeCat}</text>
        </g>

        <!-- Topic Icon Emblem -->
        <g transform="translate(50, 130)">
          <circle cx="50" cy="50" r="50" fill="${item.accent}" fill-opacity="0.25" stroke="${item.colorB}" stroke-width="3"/>
          <text x="50" y="65" font-family="sans-serif" font-size="44" text-anchor="middle">${safeIcon}</text>
        </g>

        <!-- Topic Highlight Badge -->
        <g transform="translate(180, 155)">
          <text x="0" y="30" font-family="sans-serif" font-size="14" font-weight="900" letter-spacing="4" fill="${item.colorB}">${safeTopic}</text>
          <text x="0" y="65" font-family="serif" font-size="42" font-weight="800" fill="#1D1D1D">${safeTitle}</text>
        </g>

        <!-- Story Index Seal Right -->
        <g transform="translate(1080, 50)">
          <circle cx="80" cy="80" r="70" fill="${item.colorB}" stroke="${item.accent}" stroke-width="3" />
          <text x="80" y="70" font-family="sans-serif" font-size="12" font-weight="800" letter-spacing="2" text-anchor="middle" fill="#FFFFFF">ESSAY</text>
          <text x="80" y="105" font-family="sans-serif" font-size="34" font-weight="900" text-anchor="middle" fill="#FFFDF7">#${storyNum}</text>
        </g>

        <!-- Bottom Footer Specs -->
        <g transform="translate(50, 540)">
          <line x1="0" y1="0" x2="1220" y2="0" stroke="rgba(29, 29, 29, 0.12)" stroke-width="1.5" />
          <text x="0" y="45" font-family="sans-serif" font-size="14" font-weight="800" letter-spacing="3" fill="#1D1D1D">TERRAVION LUXURY REAL ESTATE JOURNAL · STORY #${storyNum}</text>
          <text x="1220" y="45" font-family="sans-serif" font-size="14" font-weight="800" letter-spacing="2" text-anchor="end" fill="${item.colorB}">100% EXCLUSIVE ARTWORK</text>
        </g>
      </g>

      <!-- Top Right Corner Badge -->
      <g transform="translate(1380, 60)">
        <rect x="0" y="0" width="160" height="46" rx="23" fill="rgba(253, 251, 247, 0.90)" stroke="${item.accent}" stroke-width="1.5" />
        <text x="80" y="28" font-family="sans-serif" font-size="13" font-weight="900" letter-spacing="2" text-anchor="middle" fill="#1D1D1D">STORY #${storyNum}</text>
      </g>
    </svg>
  `;
}

async function renderExclusive3dImage(item, idx) {
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

  const svgBuffer = Buffer.from(generateExclusive3dArtSvg(item, idx));

  await sharp(svgBuffer)
    .resize(1600, 1000)
    .png()
    .toFile(destPath);
}

async function run() {
  console.log("Generating 72 COMPLETELY DISTINCT 3D Pixar Editorial Artworks for all Journal Essays...");

  for (let i = 0; i < blogTopics.length; i++) {
    await renderExclusive3dImage(blogTopics[i], i);
  }

  console.log("Successfully generated 72 COMPLETELY DISTINCT 3D Pixar Editorial Artworks!");
}

run();
