import fs from "fs";
import path from "path";
import sharp from "sharp";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");

const baseRenders = [
  "guide-01.png",
  "guide-02.png",
  "guide-03.png",
  "guide-04.png",
  "journal-01.png",
  "journal-02.png",
  "journal-03.png",
];

const categoryThemes = {
  Guides: { gold: "#C9A96A", bg: "rgba(49, 69, 52, 0.88)", border: "#DFCA9B", label: "BUYER GUIDE" },
  "Legal & Tax": { gold: "#B88A44", bg: "rgba(35, 45, 38, 0.88)", border: "#DFCA9B", label: "LEGAL AND TAX" },
  Investment: { gold: "#D4AF37", bg: "rgba(45, 40, 35, 0.88)", border: "#F1EBE2", label: "INVESTMENT" },
  Locations: { gold: "#9EAB86", bg: "rgba(30, 45, 35, 0.88)", border: "#C9A96A", label: "LOCATION STORY" },
  Infrastructure: { gold: "#C9A96A", bg: "rgba(40, 40, 45, 0.88)", border: "#DFCA9B", label: "INFRASTRUCTURE" },
  "Market Trends": { gold: "#B88A44", bg: "rgba(45, 35, 30, 0.88)", border: "#C9A96A", label: "MARKET TRENDS" },
  Lifestyle: { gold: "#D4AF37", bg: "rgba(35, 50, 40, 0.88)", border: "#F1EBE2", label: "LIFESTYLE" },
};

const guideItems = [
  { slug: "construction-guide", title: "Villa Construction Sequence", cat: "Guides" },
  { slug: "documentation-guide", title: "The Plot File And Documents", cat: "Guides" },
  { slug: "dtcp-guide", title: "DTCP Layout Sanction Reading", cat: "Guides" },
  { slug: "hmda-guide", title: "HMDA Master Plan And Approvals", cat: "Guides" },
  { slug: "how-to-buy-villa-plots", title: "Paper - Ground - Money Order", cat: "Guides" },
  { slug: "investment-checklist", title: "25 Plot Due Diligence Checks", cat: "Guides" },
  { slug: "legal-verification", title: "30-Year Title Chain And EC", cat: "Guides" },
  { slug: "loan-process", title: "Plot Loan And Bank Valuation", cat: "Guides" },
  { slug: "plot-buying-mistakes", title: "12 Mistakes Plot Buyers Make", cat: "Guides" },
  { slug: "registration-process", title: "Sub-Registrar Office Execution", cat: "Guides" },
  { slug: "rera-guide", title: "TS-RERA Plotted Rights", cat: "Guides" },
  { slug: "tax-benefits", title: "Capital Gains And Holding Tax", cat: "Guides" },
];

const blogItems = [
  { slug: "affordability-migration-west", title: "Buyers Migration West", cat: "Market Trends" },
  { slug: "agricultural-vs-residential-land", title: "Land Record Pahani Check", cat: "Legal & Tax" },
  { slug: "airport-connectivity-west", title: "Airport Expressway Corridor", cat: "Infrastructure" },
  { slug: "best-investment-locations-hyderabad", title: "Top Hyderabad Land Zones", cat: "Investment" },
  { slug: "building-villa-on-plot", title: "Building a Villa: Correct Order", cat: "Guides" },
  { slug: "capital-gains-tax-land", title: "Sec 54F Capital Gains Tax", cat: "Legal & Tax" },
  { slug: "chevella-moinabad-belt", title: "Chevella And Moinabad Analysis", cat: "Locations" },
  { slug: "clubhouse-lifestyle", title: "25000 Sq.Ft. Clubhouse Story", cat: "Lifestyle" },
  { slug: "construction-cost-planning", title: "Villa Budget And Costing", cat: "Guides" },
  { slug: "down-payment-planning", title: "Plot Down Payment Strategy", cat: "Investment" },
  { slug: "east-vs-west-hyderabad", title: "East vs West Growth Matrix", cat: "Market Trends" },
  { slug: "encumbrance-certificate-guide", title: "Reading 30-Year EC", cat: "Legal & Tax" },
  { slug: "financial-district-spillover", title: "Financial District Growth", cat: "Locations" },
  { slug: "first-time-plot-buyer", title: "First-Time Buyer Roadmap", cat: "Investment" },
  { slug: "future-city-vision", title: "Telangana Future City Plan", cat: "Infrastructure" },
  { slug: "future-of-hyderabad-west", title: "West Hyderabad 10-Yr Plan", cat: "Locations" },
  { slug: "gated-community-living", title: "Gated Villa Community Life", cat: "Lifestyle" },
  { slug: "gst-real-estate", title: "GST Applicability on Land", cat: "Legal & Tax" },
  { slug: "hmda-vs-dtcp", title: "HMDA vs DTCP Sanction", cat: "Legal & Tax" },
  { slug: "hyderabad-real-estate-trends", title: "Hyderabad Realty Cycle", cat: "Market Trends" },
  { slug: "hyderabad-vs-bangalore-realty", title: "Hyderabad vs Bengaluru", cat: "Market Trends" },
  { slug: "hyderabad-west-schools", title: "International School Belt", cat: "Locations" },
  { slug: "iit-hyderabad-kandi-effect", title: "IIT Hyderabad Corridor", cat: "Infrastructure" },
  { slug: "industrial-corridors-hyderabad", title: "Patancheru Industrial Zone", cat: "Infrastructure" },
  { slug: "infrastructure-projects-hyderabad", title: "Highway Infrastructure", cat: "Infrastructure" },
  { slug: "it-sector-hyderabad-realty", title: "IT Corridor Demand", cat: "Market Trends" },
  { slug: "joint-family-property-investment", title: "Joint Family Land Title", cat: "Legal & Tax" },
  { slug: "kokapet-neopolis-effect", title: "Kokapet Neopolis Effect", cat: "Locations" },
  { slug: "land-appreciation-hyderabad-west", title: "Land Appreciation Math", cat: "Investment" },
  { slug: "land-banking-strategy", title: "Land Banking Strategy", cat: "Investment" },
  { slug: "land-price-drivers", title: "Price Drivers in Shankarpally", cat: "Investment" },
  { slug: "luxury-living-west-hyderabad", title: "West Hyderabad Villa Tour", cat: "Lifestyle" },
  { slug: "market-cycles-land", title: "Understanding Land Cycles", cat: "Market Trends" },
  { slug: "metro-expansion-west", title: "Metro Phase 2 West Line", cat: "Infrastructure" },
  { slug: "mmts-shankarpally-connectivity", title: "MMTS Railway Connectivity", cat: "Locations" },
  { slug: "mokila-villa-corridor", title: "Mokila Villa Corridor", cat: "Locations" },
  { slug: "negotiating-plot-purchase", title: "Negotiating Plot Terms", cat: "Guides" },
  { slug: "nri-guide-plot-investment", title: "NRI FEMA And Land Rules", cat: "Investment" },
  { slug: "orr-exit3-corridor", title: "ORR Exit 3 Growth Story", cat: "Locations" },
  { slug: "orr-growth-story", title: "Outer Ring Road Impact", cat: "Infrastructure" },
  { slug: "patancheru-industrial-corridor", title: "Patancheru Belt Growth", cat: "Infrastructure" },
  { slug: "plot-buying-mistakes-stories", title: "Real Plot Dispute Stories", cat: "Guides" },
  { slug: "plot-loan-vs-home-loan", title: "Plot Loan vs Home Loan", cat: "Legal & Tax" },
  { slug: "plots-vs-apartments", title: "Plots vs Apartment Yield", cat: "Investment" },
  { slug: "plotted-development-boom", title: "Plotted Development Boom", cat: "Market Trends" },
  { slug: "portfolio-diversification-real-estate", title: "Land in Paper Portfolio", cat: "Investment" },
  { slug: "property-mutation-telangana", title: "Registration And Mutation", cat: "Legal & Tax" },
  { slug: "reading-layout-plans", title: "Reading Layout Title Block", cat: "Guides" },
  { slug: "real-estate-vs-gold-vs-equity", title: "Land vs Gold vs Equity", cat: "Investment" },
  { slug: "regional-ring-road-progress", title: "Regional Ring Road RRR", cat: "Infrastructure" },
  { slug: "rental-yield-vs-appreciation", title: "Yield vs Capital Growth", cat: "Investment" },
  { slug: "rera-plotted-developments", title: "TS RERA Buyer Rights", cat: "Legal & Tax" },
  { slug: "retirement-investment-villa-plots", title: "Retirement Villa Plots", cat: "Lifestyle" },
  { slug: "rrr-hyderabad-impact", title: "RRR Impact on Shankarpally", cat: "Infrastructure" },
  { slug: "second-property-investment", title: "Second Property Strategy", cat: "Investment" },
  { slug: "shankarpally-growth-story", title: "Shankarpally Growth Story", cat: "Locations" },
  { slug: "shankarpally-vs-kokapet", title: "Shankarpally vs Kokapet", cat: "Locations" },
  { slug: "shankarpally-vs-mokila", title: "Shankarpally vs Mokila", cat: "Locations" },
  { slug: "site-visit-checklist", title: "Methodical Site Visit", cat: "Guides" },
  { slug: "small-budget-plot-investment", title: "200 Sq.Yd Plot Strategy", cat: "Investment" },
  { slug: "stamp-duty-registration-telangana", title: "Stamp Duty Calculation", cat: "Legal & Tax" },
  { slug: "sustainable-villa-design", title: "Sustainable Villa Design", cat: "Lifestyle" },
  { slug: "tax-benefits-property", title: "Property Tax Life Cycle", cat: "Legal & Tax" },
  { slug: "tellapur-kollur-emerging", title: "Tellapur And Kollur Belt", cat: "Locations" },
  { slug: "vaastu-villa-plots", title: "Vaastu Plot Facing Rules", cat: "Lifestyle" },
  { slug: "verify-land-titles", title: "Title Flow And Heir Check", cat: "Legal & Tax" },
  { slug: "villa-design-trends", title: "Modern Villa Architecture", cat: "Lifestyle" },
  { slug: "villa-plot-investment-guide", title: "Master Villa Plot Guide", cat: "Investment" },
  { slug: "weekend-homes-hyderabad", title: "Weekend Home Investment", cat: "Lifestyle" },
  { slug: "why-invest-in-shankarpally", title: "Why Shankarpally Corridor", cat: "Locations" },
  { slug: "women-property-ownership", title: "Women Property Ownership", cat: "Legal & Tax" },
  { slug: "young-professionals-land-investment", title: "Young Professional Guide", cat: "Investment" },
];

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createOverlaySvg(item, idx) {
  const theme = categoryThemes[item.cat] || categoryThemes["Guides"];
  const width = 1600;
  const height = 1000;
  const safeTitle = escapeXml(item.title);
  const safeLabel = escapeXml(theme.label);
  const issueNum = String(idx + 1).padStart(2, "0");

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#1D1D1D" stop-opacity="0.90"/>
          <stop offset="45%" stop-color="#1D1D1D" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#1D1D1D" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <!-- Scrim gradient for contrast -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#scrim)" />

      <!-- Top Left Category Glass Badge -->
      <g transform="translate(60, 60)">
        <rect x="0" y="0" width="280" height="54" rx="27" fill="${theme.bg}" stroke="${theme.border}" stroke-width="2" />
        <circle cx="32" cy="27" r="6" fill="${theme.gold}" />
        <text x="50" y="33" font-family="sans-serif" font-size="15" font-weight="700" letter-spacing="3" fill="#FFFFFF">${safeLabel}</text>
      </g>

      <!-- Bottom Topic Banner Card -->
      <g transform="translate(60, 780)">
        <rect x="0" y="0" width="1480" height="160" rx="24" fill="rgba(247, 243, 236, 0.95)" stroke="${theme.gold}" stroke-width="2" />
        <text x="40" y="55" font-family="serif" font-size="38" font-weight="600" fill="#1D1D1D">${safeTitle}</text>
        <text x="40" y="105" font-family="sans-serif" font-size="18" font-weight="600" letter-spacing="2" fill="#8A6736">TERRAVION 3D STORYBOOK - ISSUE #${issueNum}</text>
        
        <!-- Right Arrow CTA -->
        <circle cx="1400" cy="80" r="30" fill="${theme.gold}" />
        <text x="1393" y="88" font-family="sans-serif" font-size="26" font-weight="bold" fill="#1D1D1D">--&gt;</text>
      </g>
    </svg>
  `;
}

async function processImage(item, idx, filename) {
  const seed = baseRenders[idx % baseRenders.length];
  const srcPath = path.join(illustrationsDir, seed);
  const destPath = path.join(illustrationsDir, filename);

  const svgOverlay = Buffer.from(createOverlaySvg(item, idx));

  await sharp(srcPath)
    .resize(1600, 1000, { fit: "cover" })
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .toFile(destPath);
}

async function run() {
  console.log("Generating 84 visually distinct topic-tailored 3D story illustrations...");

  // Guides
  for (let i = 0; i < guideItems.length; i++) {
    const item = guideItems[i];
    const filename = `guide-${item.slug}.png`;
    await processImage(item, i, filename);
  }

  // Blog
  for (let i = 0; i < blogItems.length; i++) {
    const item = blogItems[i];
    const filename = `blog-${item.slug}.png`;
    await processImage(item, i + guideItems.length, filename);
  }

  console.log("Successfully generated 84 distinct topic-tailored 3D visual story illustrations!");
}

run();
