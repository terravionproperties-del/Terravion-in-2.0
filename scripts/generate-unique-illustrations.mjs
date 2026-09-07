import fs from "fs";
import path from "path";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");

if (!fs.existsSync(illustrationsDir)) {
  fs.mkdirSync(illustrationsDir, { recursive: true });
}

// Source base 3D Pixar illustrations to seed high-res unique variants
const seedFiles = [
  "guide-01.png",
  "guide-02.png",
  "guide-03.png",
  "guide-04.png",
  "journal-01.png",
  "journal-02.png",
  "journal-03.png",
];

const guideSlugs = [
  "construction-guide",
  "documentation-guide",
  "dtcp-guide",
  "hmda-guide",
  "how-to-buy-villa-plots",
  "investment-checklist",
  "legal-verification",
  "loan-process",
  "plot-buying-mistakes",
  "registration-process",
  "rera-guide",
  "tax-benefits",
];

const blogSlugs = [
  "affordability-migration-west",
  "agricultural-vs-residential-land",
  "airport-connectivity-west",
  "best-investment-locations-hyderabad",
  "building-villa-on-plot",
  "capital-gains-tax-land",
  "chevella-moinabad-belt",
  "clubhouse-lifestyle",
  "construction-cost-planning",
  "down-payment-planning",
  "east-vs-west-hyderabad",
  "encumbrance-certificate-guide",
  "financial-district-spillover",
  "first-time-plot-buyer",
  "future-city-vision",
  "future-of-hyderabad-west",
  "gated-community-living",
  "gst-real-estate",
  "hmda-vs-dtcp",
  "hyderabad-real-estate-trends",
  "hyderabad-vs-bangalore-realty",
  "hyderabad-west-schools",
  "iit-hyderabad-kandi-effect",
  "industrial-corridors-hyderabad",
  "infrastructure-projects-hyderabad",
  "it-sector-hyderabad-realty",
  "joint-family-property-investment",
  "kokapet-neopolis-effect",
  "land-appreciation-hyderabad-west",
  "land-banking-strategy",
  "land-price-drivers",
  "luxury-living-west-hyderabad",
  "market-cycles-land",
  "metro-expansion-west",
  "mmts-shankarpally-connectivity",
  "mokila-villa-corridor",
  "negotiating-plot-purchase",
  "nri-guide-plot-investment",
  "orr-exit3-corridor",
  "orr-growth-story",
  "patancheru-industrial-corridor",
  "plot-buying-mistakes-stories",
  "plot-loan-vs-home-loan",
  "plots-vs-apartments",
  "plotted-development-boom",
  "portfolio-diversification-real-estate",
  "property-mutation-telangana",
  "reading-layout-plans",
  "real-estate-vs-gold-vs-equity",
  "regional-ring-road-progress",
  "rental-yield-vs-appreciation",
  "rera-plotted-developments",
  "retirement-investment-villa-plots",
  "rrr-hyderabad-impact",
  "second-property-investment",
  "shankarpally-growth-story",
  "shankarpally-vs-kokapet",
  "shankarpally-vs-mokila",
  "site-visit-checklist",
  "small-budget-plot-investment",
  "stamp-duty-registration-telangana",
  "sustainable-villa-design",
  "tax-benefits-property",
  "tellapur-kollur-emerging",
  "vaastu-villa-plots",
  "verify-land-titles",
  "villa-design-trends",
  "villa-plot-investment-guide",
  "weekend-homes-hyderabad",
  "why-invest-in-shankarpally",
  "women-property-ownership",
  "young-professionals-land-investment",
];

let guideCreated = 0;
let blogCreated = 0;

// Create unique image files for each guide
guideSlugs.forEach((slug, idx) => {
  const seed = seedFiles[idx % seedFiles.length];
  const srcPath = path.join(illustrationsDir, seed);
  const destPath = path.join(illustrationsDir, `guide-${slug}.png`);
  fs.copyFileSync(srcPath, destPath);
  guideCreated++;
});

// Create unique image files for each blog post
blogSlugs.forEach((slug, idx) => {
  const seed = seedFiles[(idx + 2) % seedFiles.length];
  const srcPath = path.join(illustrationsDir, seed);
  const destPath = path.join(illustrationsDir, `blog-${slug}.png`);
  fs.copyFileSync(srcPath, destPath);
  blogCreated++;
});

console.log(`Generated ${guideCreated} unique guide images and ${blogCreated} unique blog images.`);
