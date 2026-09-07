import fs from "fs";
import path from "path";
import http from "http";

const BASE_URL = "http://localhost:3000";

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

function fetchHead(urlPath) {
  return new Promise((resolve) => {
    const req = http.request(`${BASE_URL}${urlPath}`, { method: "HEAD" }, (res) => {
      resolve(res.statusCode);
    });
    req.on("error", () => resolve(500));
    req.end();
  });
}

function fetchGet(urlPath) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${urlPath}`, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, body }));
    }).on("error", (err) => resolve({ statusCode: 500, body: "", error: err }));
  });
}

async function runAudit() {
  console.log("Running Empirical HTTP HEAD & GET Audit...\n");

  const imageResults = [];
  const imageMap = new Map();
  const articleFailures = [];
  const sampleArticles = [];

  // 1. Audit Guide Images (HEAD request)
  for (const slug of guideSlugs) {
    const imgPath = `/illustrations/guide-${slug}.png`;
    const code = await fetchHead(imgPath);
    imageResults.push({ path: imgPath, status: code });
    imageMap.set(imgPath, (imageMap.get(imgPath) || 0) + 1);
  }

  // 2. Audit Blog Images (HEAD request)
  for (const slug of blogSlugs) {
    const imgPath = `/illustrations/blog-${slug}.png`;
    const code = await fetchHead(imgPath);
    imageResults.push({ path: imgPath, status: code });
    imageMap.set(imgPath, (imageMap.get(imgPath) || 0) + 1);
  }

  // 3. Audit Index Pages
  const blogIndexRes = await fetchGet("/blog");
  const guidesIndexRes = await fetchGet("/guides");

  console.log(`[INDEX] /blog HTTP ${blogIndexRes.statusCode}`);
  console.log(`[INDEX] /guides HTTP ${guidesIndexRes.statusCode}\n`);

  const sampledGuides = ["construction-guide", "dtcp-guide", "how-to-buy-villa-plots", "loan-process", "rera-guide"];
  const sampledBlog = ["reading-layout-plans", "site-visit-checklist", "negotiating-plot-purchase", "shankarpally-growth-story", "future-of-hyderabad-west"];

  const allArticles = [
    ...guideSlugs.map((s) => ({ type: "Guide", slug: s, path: `/guides/${s}`, imgPath: `guide-${s}.png` })),
    ...blogSlugs.map((s) => ({ type: "Journal", slug: s, path: `/blog/${s}`, imgPath: `blog-${s}.png` })),
  ];

  for (const item of allArticles) {
    const res = await fetchGet(item.path);
    const html = res.body;

    const hasHeroImg = html.includes(item.imgPath) || html.includes(encodeURIComponent(item.imgPath));
    const hasTodayStory = html.includes("Today") && html.includes("Story");
    const hasChapterScene = html.includes("Visual Scene") || html.includes("Chapter");
    const hasTimeline = html.includes("Step-by-Step") || html.includes("Timeline") || html.includes("Step") || html.includes("timeline");
    const hasCallout = html.includes("Insight") || html.includes("★") || html.includes("Expert");
    const hasConclusion = html.includes("Story Conclusion") || html.includes("Outcome");

    const isSuccess = res.statusCode === 200 && hasHeroImg && hasTodayStory && hasConclusion;

    if (!isSuccess) {
      articleFailures.push({
        path: item.path,
        statusCode: res.statusCode,
        hasHeroImg,
        hasTodayStory,
        hasChapterScene,
        hasTimeline,
        hasCallout,
        hasConclusion,
      });
    }

    if (sampledGuides.includes(item.slug) || sampledBlog.includes(item.slug)) {
      sampleArticles.push({
        type: item.type,
        slug: item.slug,
        path: item.path,
        statusCode: res.statusCode,
        hasHeroImg,
        hasTodayStory,
        hasChapterScene,
        hasTimeline,
        hasCallout,
        hasConclusion,
      });
    }
  }

  const totalImages = imageResults.length;
  const http200Images = imageResults.filter((r) => r.status === 200).length;
  const duplicateImages = Array.from(imageMap.entries()).filter(([_, count]) => count > 1).length;
  const placeholderImages = imageResults.filter((r) => r.path.includes("placeholder")).length;

  console.log("=== EMPIRICAL AUDIT RESULTS ===");
  console.log(`Total Image Files Audited: ${totalImages}`);
  console.log(`HTTP 200 OK Images: ${http200Images} / ${totalImages}`);
  console.log(`Duplicate Image Usage: ${duplicateImages}`);
  console.log(`Placeholder Images Found: ${placeholderImages}`);
  console.log(`Failed Articles Count: ${articleFailures.length} / ${allArticles.length}\n`);

  console.log("=== SAMPLE DETAILED ARTICLE AUDIT ===");
  console.table(sampleArticles);

  fs.writeFileSync(
    path.join(process.cwd(), "audit_report.json"),
    JSON.stringify({ totalImages, http200Images, duplicateImages, placeholderImages, articleFailures, sampleArticles, imageResults }, null, 2)
  );
}

runAudit();
