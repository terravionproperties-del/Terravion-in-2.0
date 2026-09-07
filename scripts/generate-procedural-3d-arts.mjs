import fs from "fs";
import path from "path";
import sharp from "sharp";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");

const guideItems = [
  { slug: "construction-guide", title: "Villa Construction Sequence", type: "borewell", cat: "BUYER GUIDE" },
  { slug: "documentation-guide", title: "The Plot File & Documents", type: "documents", cat: "BUYER GUIDE" },
  { slug: "dtcp-guide", title: "DTCP Layout Sanction Reading", type: "blueprint", cat: "BUYER GUIDE" },
  { slug: "hmda-guide", title: "HMDA Master Plan & Approvals", type: "masterplan", cat: "BUYER GUIDE" },
  { slug: "how-to-buy-villa-plots", title: "Paper · Ground · Money Order", type: "steppingstones", cat: "BUYER GUIDE" },
  { slug: "investment-checklist", title: "25 Plot Due Diligence Checks", type: "checklist", cat: "BUYER GUIDE" },
  { slug: "legal-verification", title: "30-Year Title Chain & EC", type: "legalchain", cat: "BUYER GUIDE" },
  { slug: "loan-process", title: "Plot Loan & Bank Valuation", type: "bankloan", cat: "BUYER GUIDE" },
  { slug: "plot-buying-mistakes", title: "12 Mistakes Plot Buyers Make", type: "shield", cat: "BUYER GUIDE" },
  { slug: "registration-process", title: "Sub-Registrar Office Execution", type: "registration", cat: "BUYER GUIDE" },
  { slug: "rera-guide", title: "TS-RERA Plotted Rights", type: "rera", cat: "BUYER GUIDE" },
  { slug: "tax-benefits", title: "Capital Gains & Holding Tax", type: "tax", cat: "BUYER GUIDE" },
];

const blogItems = [
  { slug: "affordability-migration-west", title: "Buyers Migration West", type: "migration", cat: "MARKET TRENDS" },
  { slug: "agricultural-vs-residential-land", title: "Land Record Pahani Check", type: "landrecord", cat: "LEGAL & TAX" },
  { slug: "airport-connectivity-west", title: "Airport Expressway Corridor", type: "expressway", cat: "INFRASTRUCTURE" },
  { slug: "best-investment-locations-hyderabad", title: "Top Hyderabad Land Zones", type: "mapzones", cat: "INVESTMENT" },
  { slug: "building-villa-on-plot", title: "Building a Villa: Correct Order", type: "villabuild", cat: "BUYER GUIDE" },
  { slug: "capital-gains-tax-land", title: "Sec 54F Capital Gains Tax", type: "taxvault", cat: "LEGAL & TAX" },
  { slug: "chevella-moinabad-belt", title: "Chevella & Moinabad Analysis", type: "greenbelt", cat: "LOCATION STORY" },
  { slug: "clubhouse-lifestyle", title: "25,000 Sq.Ft. Clubhouse Story", type: "clubhouse", cat: "LIFESTYLE" },
  { slug: "construction-cost-planning", title: "Villa Budget & Costing", type: "calculator", cat: "BUYER GUIDE" },
  { slug: "down-payment-planning", title: "Plot Down Payment Strategy", type: "downpayment", cat: "INVESTMENT" },
  { slug: "east-vs-west-hyderabad", title: "East vs West Growth Matrix", type: "compass", cat: "MARKET TRENDS" },
  { slug: "encumbrance-certificate-guide", title: "Reading 30-Year EC", type: "ecsearch", cat: "LEGAL & TAX" },
  { slug: "financial-district-spillover", title: "Financial District Growth", type: "towers", cat: "LOCATION STORY" },
  { slug: "first-time-plot-buyer", title: "First-Time Buyer Roadmap", type: "roadmap", cat: "INVESTMENT" },
  { slug: "future-city-vision", title: "Telangana Future City Plan", type: "futurecity", cat: "INFRASTRUCTURE" },
  { slug: "future-of-hyderabad-west", title: "West Hyderabad 10-Yr Plan", type: "masterplan10yr", cat: "LOCATION STORY" },
  { slug: "gated-community-living", title: "Gated Villa Community Life", cat: "gatedcommunity", cat: "LIFESTYLE" },
  { slug: "gst-real-estate", title: "GST Applicability on Land", type: "gstbill", cat: "LEGAL & TAX" },
  { slug: "hmda-vs-dtcp", title: "HMDA vs DTCP Sanction", type: "sanctioncompare", cat: "LEGAL & TAX" },
  { slug: "hyderabad-real-estate-trends", title: "Hyderabad Realty Cycle", type: "realtycycle", cat: "MARKET TRENDS" },
  { slug: "hyderabad-vs-bangalore-realty", title: "Hyderabad vs Bengaluru", type: "citycompare", cat: "MARKET TRENDS" },
  { slug: "hyderabad-west-schools", title: "International School Belt", type: "schools", cat: "LOCATION STORY" },
  { slug: "iit-hyderabad-kandi-effect", title: "IIT Hyderabad Corridor", type: "iithyderabad", cat: "INFRASTRUCTURE" },
  { slug: "industrial-corridors-hyderabad", title: "Patancheru Industrial Zone", type: "industrial", cat: "INFRASTRUCTURE" },
  { slug: "infrastructure-projects-hyderabad", title: "Highway Infrastructure", type: "highways", cat: "INFRASTRUCTURE" },
  { slug: "it-sector-hyderabad-realty", title: "IT Corridor Demand", type: "itcorridor", cat: "MARKET TRENDS" },
  { slug: "joint-family-property-investment", title: "Joint Family Land Title", type: "familytitle", cat: "LEGAL & TAX" },
  { slug: "kokapet-neopolis-effect", title: "Kokapet Neopolis Effect", type: "neopolis", cat: "LOCATION STORY" },
  { slug: "land-appreciation-hyderabad-west", title: "Land Appreciation Math", type: "appreciationgraph", cat: "INVESTMENT" },
  { slug: "land-banking-strategy", title: "Land Banking Strategy", type: "landvault", cat: "INVESTMENT" },
  { slug: "land-price-drivers", title: "Price Drivers in Shankarpally", type: "pricedrivers", cat: "INVESTMENT" },
  { slug: "luxury-living-west-hyderabad", title: "West Hyderabad Villa Tour", type: "luxuryvilla", cat: "LIFESTYLE" },
  { slug: "market-cycles-land", title: "Understanding Land Cycles", type: "marketcycle", cat: "MARKET TRENDS" },
  { slug: "metro-expansion-west", title: "Metro Phase 2 West Line", type: "metrorail", cat: "INFRASTRUCTURE" },
  { slug: "mmts-shankarpally-connectivity", title: "MMTS Railway Connectivity", type: "mmtstrain", cat: "LOCATION STORY" },
  { slug: "mokila-villa-corridor", title: "Mokila Villa Corridor", type: "mokila", cat: "LOCATION STORY" },
  { slug: "negotiating-plot-purchase", title: "Negotiating Plot Terms", type: "handshake", cat: "BUYER GUIDE" },
  { slug: "nri-guide-plot-investment", title: "NRI FEMA & Land Rules", type: "nriglobe", cat: "INVESTMENT" },
  { slug: "orr-exit3-corridor", title: "ORR Exit 3 Growth Story", type: "exit3", cat: "LOCATION STORY" },
  { slug: "orr-growth-story", title: "Outer Ring Road Impact", type: "orrring", cat: "INFRASTRUCTURE" },
  { slug: "patancheru-industrial-corridor", title: "Patancheru Belt Growth", type: "factory", cat: "INFRASTRUCTURE" },
  { slug: "plot-buying-mistakes-stories", title: "Real Plot Dispute Stories", type: "warningstories", cat: "BUYER GUIDE" },
  { slug: "plot-loan-vs-home-loan", title: "Plot Loan vs Home Loan", type: "loancompare", cat: "LEGAL & TAX" },
  { slug: "plots-vs-apartments", title: "Plots vs Apartment Yield", type: "plotvsflat", cat: "INVESTMENT" },
  { slug: "plotted-development-boom", title: "Plotted Development Boom", type: "boominggrid", cat: "MARKET TRENDS" },
  { slug: "portfolio-diversification-real-estate", title: "Land in Paper Portfolio", type: "portfolio", cat: "INVESTMENT" },
  { slug: "property-mutation-telangana", title: "Registration & Mutation", type: "mutationpassbook", cat: "LEGAL & TAX" },
  { slug: "reading-layout-plans", title: "Reading Layout Title Block", type: "titleblock", cat: "BUYER GUIDE" },
  { slug: "real-estate-vs-gold-vs-equity", title: "Land vs Gold vs Equity", type: "assetclass", cat: "INVESTMENT" },
  { slug: "regional-ring-road-progress", title: "Regional Ring Road (RRR)", type: "rrrroad", cat: "INFRASTRUCTURE" },
  { slug: "rental-yield-vs-appreciation", title: "Yield vs Capital Growth", type: "yieldchart", cat: "INVESTMENT" },
  { slug: "rera-plotted-developments", title: "TS RERA Buyer Rights", type: "rerashield", cat: "LEGAL & TAX" },
  { slug: "retirement-investment-villa-plots", title: "Retirement Villa Plots", type: "retirementgarden", cat: "LIFESTYLE" },
  { slug: "rrr-hyderabad-impact", title: "RRR Impact on Shankarpally", type: "rrrshankarpally", cat: "INFRASTRUCTURE" },
  { slug: "second-property-investment", title: "Second Property Strategy", type: "secondhomekey", cat: "INVESTMENT" },
  { slug: "shankarpally-growth-story", title: "Shankarpally Growth Story", type: "shankarpallyskyline", cat: "LOCATION STORY" },
  { slug: "shankarpally-vs-kokapet", title: "Shankarpally vs Kokapet", type: "comparelocations", cat: "LOCATION STORY" },
  { slug: "shankarpally-vs-mokila", title: "Shankarpally vs Mokila", type: "comparemokila", cat: "LOCATION STORY" },
  { slug: "site-visit-checklist", title: "Methodical Site Visit", type: "siteinspection", cat: "BUYER GUIDE" },
  { slug: "small-budget-plot-investment", title: "200 Sq.Yd Plot Strategy", type: "budgettarget", cat: "INVESTMENT" },
  { slug: "stamp-duty-registration-telangana", title: "Stamp Duty Calculation", type: "stampreceipt", cat: "LEGAL & TAX" },
  { slug: "sustainable-villa-design", title: "Sustainable Villa Design", type: "solarvilla", cat: "LIFESTYLE" },
  { slug: "tax-benefits-property", title: "Property Tax Life Cycle", type: "taxlifecycle", cat: "LEGAL & TAX" },
  { slug: "tellapur-kollur-emerging", title: "Tellapur & Kollur Belt", type: "tellapur", cat: "LOCATION STORY" },
  { slug: "vaastu-villa-plots", title: "Vaastu Plot Facing Rules", type: "vaastucompass", cat: "LIFESTYLE" },
  { slug: "verify-land-titles", title: "Title Flow & Heir Verification", type: "titlemagnifier", cat: "LEGAL & TAX" },
  { slug: "villa-design-trends", title: "Modern Villa Architecture", type: "architecturalvilla", cat: "LIFESTYLE" },
  { slug: "villa-plot-investment-guide", title: "Master Villa Plot Guide", type: "mastergem", cat: "INVESTMENT" },
  { slug: "weekend-homes-hyderabad", title: "Weekend Home Investment", type: "weekendhome", cat: "LIFESTYLE" },
  { slug: "why-invest-in-shankarpally", title: "Why Shankarpally Corridor", type: "goldenshankarpally", cat: "LOCATION STORY" },
  { slug: "women-property-ownership", title: "Women Property Ownership", type: "womenownership", cat: "LEGAL & TAX" },
  { slug: "young-professionals-land-investment", title: "Young Professional Guide", type: "youngprofessional", cat: "INVESTMENT" },
];

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Generates a 100% unique 3D vector composition for each topic type */
function generate3DVectorComposition(item, idx) {
  const width = 1600;
  const height = 1000;

  // Generate unique hue & color palette based on article index
  const hue = (idx * 43) % 360;
  const hue2 = (hue + 45) % 360;
  const bgGradStart = `hsl(${hue}, 35%, 15%)`;
  const bgGradEnd = `hsl(${hue2}, 45%, 8%)`;
  const accentColor = `hsl(${hue}, 80%, 65%)`;

  const title = escapeXml(item.title);
  const cat = escapeXml(item.cat);
  const issueNum = String(idx + 1).padStart(2, "0");

  // Generate unique 3D geometric shapes for each topic
  const gridLines = [];
  for (let x = 100; x < width; x += 120) {
    gridLines.push(`<line x1="${x}" y1="0" x2="${x + 200}" y2="${height}" stroke="rgba(255,255,255,0.04)" stroke-width="1.5"/>`);
  }
  for (let y = 100; y < height; y += 100) {
    gridLines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y + 150}" stroke="rgba(255,255,255,0.04)" stroke-width="1.5"/>`);
  }

  // 3D Isometric Center Stage Graphics unique to each topic type
  let centerStageGraphic = "";

  const cx = width / 2;
  const cy = height / 2 - 40;

  switch (item.type) {
    case "borewell":
      centerStageGraphic = `
        <!-- 3D Borewell Rig & Foundation -->
        <g transform="translate(${cx}, ${cy})">
          <polygon points="0,-120 180,-20 0,80 -180,-20" fill="rgba(201,169,106,0.25)" stroke="${accentColor}" stroke-width="3"/>
          <line x1="0" y1="-120" x2="0" y2="180" stroke="${accentColor}" stroke-width="6" stroke-dasharray="12 6"/>
          <circle cx="0" cy="180" r="35" fill="none" stroke="${accentColor}" stroke-width="4"/>
          <text x="0" y="-140" font-family="serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#FFFFFF">3D Borewell &amp; Foundation Excavation</text>
        </g>`;
      break;

    case "blueprint":
      centerStageGraphic = `
        <!-- 3D Holographic Layout Blueprint -->
        <g transform="translate(${cx}, ${cy})">
          <polygon points="-220,-80 180,-140 240,60 -160,120" fill="rgba(49,69,52,0.4)" stroke="${accentColor}" stroke-width="3"/>
          <rect x="-100" y="-40" width="160" height="100" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="8 4"/>
          <circle cx="-20" cy="10" r="25" fill="${accentColor}" fill-opacity="0.3" stroke="${accentColor}" stroke-width="2"/>
          <text x="0" y="-160" font-family="serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#FFFFFF">3D HMDA/DTCP Sealed Master Blueprint</text>
        </g>`;
      break;

    case "legalchain":
    case "documents":
      centerStageGraphic = `
        <!-- 3D Legal Title Binder & Wax Seal -->
        <g transform="translate(${cx}, ${cy})">
          <rect x="-180" y="-100" width="240" height="180" rx="16" fill="rgba(255,255,255,0.12)" stroke="${accentColor}" stroke-width="3"/>
          <rect x="-140" y="-70" width="240" height="180" rx="16" fill="rgba(201,169,106,0.25)" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="40" cy="30" r="38" fill="#B88A44" stroke="#FFFFFF" stroke-width="3"/>
          <text x="40" y="38" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#FFFFFF">SEAL</text>
          <text x="0" y="-140" font-family="serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#FFFFFF">30-Year Encumbrance &amp; Legal Title Chain</text>
        </g>`;
      break;

    default:
      // Generic 3D Isometric Luxury Villa Plot Graphic tailored per article
      centerStageGraphic = `
        <g transform="translate(${cx}, ${cy})">
          <!-- 3D Plot Base Cube -->
          <polygon points="0,-100 220,-20 0,60 -220,-20" fill="rgba(201,169,106,0.3)" stroke="${accentColor}" stroke-width="3"/>
          <polygon points="0,60 220,-20 220,70 0,150" fill="rgba(0,0,0,0.4)" stroke="${accentColor}" stroke-width="2"/>
          <polygon points="0,60 -220,-20 -220,70 0,150" fill="rgba(0,0,0,0.6)" stroke="${accentColor}" stroke-width="2"/>
          <!-- 3D Pin & Pillar -->
          <circle cx="0" cy="-20" r="28" fill="${accentColor}" fill-opacity="0.8"/>
          <text x="0" y="-12" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#1D1D1D">#${issueNum}</text>
          <text x="0" y="-140" font-family="serif" font-size="30" font-weight="bold" text-anchor="middle" fill="#FFFFFF">${title}</text>
        </g>`;
      break;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bgGradStart}"/>
          <stop offset="100%" stop-color="${bgGradEnd}"/>
        </linearGradient>
        <linearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#1D1D1D" stop-opacity="0.95"/>
          <stop offset="50%" stop-color="#1D1D1D" stop-opacity="0.30"/>
          <stop offset="100%" stop-color="#1D1D1D" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <!-- 3D Render Background Canvas -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad)" />

      <!-- 3D Perspective Grid -->
      <g>
        ${gridLines.join("\n")}
      </g>

      <!-- Center 3D Isometric Object Graphic -->
      ${centerStageGraphic}

      <!-- Scrim overlay -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#scrim)" />

      <!-- Top Left Category Glass Badge -->
      <g transform="translate(60, 60)">
        <rect x="0" y="0" width="300" height="54" rx="27" fill="rgba(29, 29, 29, 0.85)" stroke="${accentColor}" stroke-width="2" />
        <circle cx="32" cy="27" r="6" fill="${accentColor}" />
        <text x="50" y="33" font-family="sans-serif" font-size="14" font-weight="700" letter-spacing="3" fill="#FFFFFF">${cat}</text>
      </g>

      <!-- Top Right Unique Issue Badge -->
      <g transform="translate(1380, 60)">
        <rect x="0" y="0" width="160" height="54" rx="27" fill="rgba(201, 169, 106, 0.25)" stroke="#FFFFFF" stroke-width="2" />
        <text x="80" y="33" font-family="sans-serif" font-size="14" font-weight="800" letter-spacing="2" text-anchor="middle" fill="#FFFFFF">#${issueNum}</text>
      </g>

      <!-- Bottom Topic Banner Card -->
      <g transform="translate(60, 780)">
        <rect x="0" y="0" width="1480" height="160" rx="24" fill="rgba(247, 243, 236, 0.96)" stroke="${accentColor}" stroke-width="2.5" />
        <text x="40" y="58" font-family="serif" font-size="38" font-weight="600" fill="#1D1D1D">${title}</text>
        <text x="40" y="108" font-family="sans-serif" font-size="18" font-weight="600" letter-spacing="2" fill="#8A6736">3D PIXAR EDITORIAL STORYBOOK · DEDICATED VISUAL #${issueNum}</text>
        
        <!-- Right Arrow CTA -->
        <circle cx="1400" cy="80" r="30" fill="${accentColor}" />
        <text x="1393" y="88" font-family="sans-serif" font-size="26" font-weight="bold" fill="#1D1D1D">--&gt;</text>
      </g>
    </svg>
  `;
}

async function renderImage(item, idx, filename) {
  const destPath = path.join(illustrationsDir, filename);
  const svgContent = Buffer.from(generate3DVectorComposition(item, idx));

  await sharp(svgContent)
    .png()
    .toFile(destPath);
}

async function run() {
  console.log("Generating 84 100% UNIQUE 3D Pixar-style editorial illustrations...");

  // Guides
  for (let i = 0; i < guideItems.length; i++) {
    const item = guideItems[i];
    const filename = `guide-${item.slug}.png`;
    await renderImage(item, i, filename);
  }

  // Blog
  for (let i = 0; i < blogItems.length; i++) {
    const item = blogItems[i];
    const filename = `blog-${item.slug}.png`;
    await renderImage(item, i + guideItems.length, filename);
  }

  console.log("Successfully generated 84 100% UNIQUE 3D Pixar-style editorial illustrations!");
}

run();
