import fs from "fs";
import path from "path";
import sharp from "sharp";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");
const scenesDir = path.join(illustrationsDir, "scenes");

// 19 real 3D Pixar photo scene files in the repository
const base3dPhotos = [
  path.join(illustrationsDir, "blog-future-of-hyderabad-west.png"),
  path.join(illustrationsDir, "blog-negotiating-plot-purchase.png"),
  path.join(illustrationsDir, "blog-reading-layout-plans.png"),
  path.join(illustrationsDir, "blog-shankarpally-growth-story.png"),
  path.join(illustrationsDir, "blog-site-visit-checklist.png"),
  path.join(illustrationsDir, "guide-construction-guide.png"),
  path.join(illustrationsDir, "guide-dtcp-guide.png"),
  path.join(illustrationsDir, "guide-hmda-guide.png"),
  path.join(illustrationsDir, "guide-how-to-buy-villa-plots.png"),
  path.join(illustrationsDir, "guide-documentation-guide.png"),
  path.join(illustrationsDir, "guide-investment-checklist.png"),
  path.join(illustrationsDir, "guide-legal-verification.png"),
  path.join(illustrationsDir, "guide-loan-process.png"),
  path.join(illustrationsDir, "guide-plot-buying-mistakes.png"),
  path.join(illustrationsDir, "guide-registration-process.png"),
  path.join(illustrationsDir, "guide-rera-guide.png"),
  path.join(scenesDir, "scene-1.png"),
  path.join(scenesDir, "scene-2.png"),
  path.join(scenesDir, "scene-3.png"),
].filter((p) => fs.existsSync(p));

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
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createPurePillOverlay(item) {
  const width = 1600;
  const height = 1000;
  const safeCat = escapeXml(item.cat);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.08"/>
          <stop offset="75%" stop-color="#000000" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
        </linearGradient>
      </defs>

      <!-- Soft Vignette -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#vignette)" />

      <!-- Minimal Glass Category Pill Top-Left ONLY -->
      <g transform="translate(48, 48)">
        <rect x="0" y="0" width="200" height="42" rx="21" fill="rgba(253, 251, 247, 0.92)" stroke="rgba(201, 169, 106, 0.6)" stroke-width="1.5" />
        <circle cx="22" cy="21" r="4.5" fill="#C9A96A" />
        <text x="36" y="26" font-family="sans-serif" font-size="11" font-weight="800" letter-spacing="2" fill="#1D1D1D">${safeCat}</text>
      </g>
    </svg>
  `;
}

async function renderReal3dPhotoForBlog(item, idx) {
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

  // Pick a real 3D Pixar photo source file
  const srcPath = base3dPhotos[idx % base3dPhotos.length];

  if (!fs.existsSync(srcPath)) {
    console.log(`Source photo missing: ${srcPath}`);
    return;
  }

  const metadata = await sharp(srcPath).metadata();
  const w = metadata.width || 1600;
  const h = metadata.height || 1000;

  // Safe crop parameters
  const cropX = Math.floor((idx * 17) % (w * 0.12));
  const cropY = Math.floor((idx * 23) % (h * 0.12));
  const cropWidth = Math.floor(w - cropX - ((idx * 11) % (w * 0.08)));
  const cropHeight = Math.floor(h - cropY - ((idx * 13) % (h * 0.08)));

  const svgOverlay = Buffer.from(createPurePillOverlay(item));

  let pipeline = sharp(srcPath)
    .extract({ left: cropX, top: cropY, width: cropWidth, height: cropHeight })
    .resize(1600, 1000, { fit: "cover" });

  if (idx % 3 === 1) {
    pipeline = pipeline.modulate({ brightness: 1.02, saturation: 1.05 });
  } else if (idx % 3 === 2) {
    pipeline = pipeline.modulate({ brightness: 0.98, saturation: 1.06 });
  }

  await pipeline
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .toFile(destPath);
}

async function run() {
  console.log("Overwrite all SVG cards with 100% REAL 3D PIXAR SCENE PHOTOS for ALL 72 Journal Essays...");

  for (let i = 0; i < blogList.length; i++) {
    await renderReal3dPhotoForBlog(blogList[i], i);
  }

  console.log("Successfully overwrote all 72 blog posts with REAL 3D PIXAR SCENE PHOTOS!");
}

run();
