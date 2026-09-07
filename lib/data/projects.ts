import type { Project } from "@/lib/types";

/**
 * Project data sourced from Terravion / SouthPride public project material.
 * Entries marked [PLACEHOLDER — replace with verified business data] need
 * confirmation from the business before launch.
 */
export const projects: Project[] = [
  {
    slug: "sanctuary",
    name: "Sanctuary",
    shortName: "Sanctuary",
    approval: "HMDA Approved",
    status: "ready",
    location: "Julkal, Shankarpally, Hyderabad, Telangana 502285",
    acreage: "45 acres",
    plots: "475 plots",
    plotSizes: "200 – 750 sq. yds",
    roads: "Paved internal roads with pedestrian footpaths",
    priceFrom: "₹45 Lakh onwards",
    headline: "Forty-five acres of stillness, minutes from the city that never slows.",
    intro:
      "Sanctuary is an HMDA-approved gated plotted community spread across 45 acres at Julkal, Shankarpally — 475 fully Vaastu-compliant, ready-to-construct villa plots arranged around a 25,000 sq. ft. clubhouse, tree-lined avenues and landscaped commons.",
    narrative: [
      "Every plot in Sanctuary is 100% Vaastu-compliant and ready for construction, with water, electricity and underground drainage brought to each boundary. The masterplan privileges openness: paved internal roads are edged with pedestrian-friendly footpaths and avenue plantation, and the community is enclosed by a compound wall with gated entry.",
      "At the heart of the community stands a 25,000 sq. ft. clubhouse — a grand banquet hall, fine-dining restaurant and café, a swimming pool complex, two indoor badminton courts, a fitness centre, an indoor games and recreation lounge, a business centre with co-working spaces, and three guest suites for visiting family.",
      "Shankarpally's location does the rest: quick access to the Outer Ring Road, the proposed Regional Ring Road, IIT Hyderabad, the western IT corridor and some of Hyderabad's most reputed schools.",
    ],
    highlights: [
      { label: "Extent", value: "45 acres" },
      { label: "Plots", value: "475" },
      { label: "Plot sizes", value: "200–750 sq. yds" },
      { label: "Approval", value: "HMDA" },
      { label: "Clubhouse", value: "25,000 sq. ft." },
      { label: "Vaastu", value: "100% compliant" },
    ],
    amenities: [
      "25,000 sq. ft. clubhouse",
      "Grand banquet hall",
      "Fine-dining restaurant & café",
      "Swimming pool complex",
      "Two indoor badminton courts",
      "Fitness centre & gymnasium",
      "Indoor games & recreation lounge",
      "Business centre & co-working spaces",
      "Three guest suites",
      "Landscaped open spaces & community seating",
      "Avenue plantation with paved footpaths",
      "Underground water, electricity & drainage",
      "Rainwater harvesting",
      "Compound wall with gated entry",
    ],
    distances: [
      { place: "Shankarpally town", distanceKm: 5, driveTime: "10 min" },
      { place: "Outer Ring Road (Exit 3, Patancheru side)", distanceKm: 15, driveTime: "20 min" },
      { place: "IIT Hyderabad, Kandi", distanceKm: 18, driveTime: "25 min" },
      { place: "Financial District, Nanakramguda", distanceKm: 28, driveTime: "40 min" },
      { place: "Gachibowli", distanceKm: 30, driveTime: "45 min" },
      { place: "Rajiv Gandhi International Airport", distanceKm: 55, driveTime: "60 min" },
    ],
    faqs: [
      {
        q: "Is Sanctuary HMDA approved?",
        a: "Yes. Sanctuary is an HMDA-approved gated plotted development at Julkal, Shankarpally. Layout permission documents are available for verification at the site office before booking.",
      },
      {
        q: "What plot sizes are available in Sanctuary?",
        a: "Plots range from 200 sq. yds to 750 sq. yds, all Vaastu-compliant and ready to construct, with utilities provisioned to each plot boundary.",
      },
      {
        q: "What does the Sanctuary clubhouse include?",
        a: "The 25,000 sq. ft. clubhouse houses a banquet hall, restaurant and café, swimming pool complex, two indoor badminton courts, a gymnasium, an indoor games lounge, a business centre with co-working spaces, and three guest suites.",
      },
      {
        q: "Can NRIs buy plots in Sanctuary?",
        a: "Yes. The project is NRI-friendly and FEMA-compliant. Our team assists NRI buyers with documentation, Power of Attorney arrangements and repatriation-compliant payment channels.",
      },
    ],
    accent: "#b08d46",
    metaTitle: "Sanctuary Shankarpally — 45-Acre HMDA Approved Villa Plots",
    metaDescription:
      "Sanctuary by Terravion: 475 HMDA-approved, Vaastu-compliant villa plots (200–750 sq yds) across 45 acres in Julkal, Shankarpally with a 25,000 sq ft clubhouse. From ₹45L.",
    keywords: [
      "Sanctuary Shankarpally",
      "HMDA approved plots Shankarpally",
      "villa plots Shankarpally",
      "gated community plots Hyderabad west",
    ],
  },
  {
    slug: "raghunath-county",
    name: "Raghunath County",
    shortName: "Raghunath County",
    approval: "DTCP Approved",
    status: "ready",
    location: "Shankarpally–Mominpet Road, Shankarpally, Telangana",
    acreage: "19 acres",
    plots: "Limited-release villa plots", // [PLACEHOLDER — replace with verified plot count]
    plotSizes: "167 – 500 sq. yds", // [PLACEHOLDER — verify size range with business]
    roads: "40 ft & 33 ft CC roads",
    priceFrom: "₹45 Lakh onwards", // [PLACEHOLDER — verify project-specific pricing]
    headline: "Nineteen acres on the hundred-feet road, built for the long view.",
    intro:
      "Raghunath County is a 19-acre DTCP-approved villa plot community facing the 100-feet Shankarpally to Mehtabkhan Guda–Mominpet main road — a grand entrance arch, 40- and 33-feet CC roads, and a secure compound wall framing a masterplan of avenue plantation and open commons.",
    narrative: [
      "Frontage decides fortunes in plotted development, and Raghunath County holds one of Shankarpally's best: direct face onto the 100-feet main road toward Mominpet, minutes from Shankarpally's railway station, schools and daily markets.",
      "Inside the gate, the community is laid with 40-feet and 33-feet cement concrete roads, modern streetlights, avenue plantation with paved footpaths, and underground water, electricity and drainage to every plot. Landscaped open spaces and community seating areas thread the layout together.",
      "DTCP approval, clear titles and a compound-walled perimeter make it as sound on paper as it is on the ground — a plot you can build on tomorrow, or hold as the corridor appreciates around it.",
    ],
    highlights: [
      { label: "Extent", value: "19 acres" },
      { label: "Approval", value: "DTCP" },
      { label: "Frontage", value: "100-ft main road" },
      { label: "Internal roads", value: "40 & 33 ft CC" },
      { label: "Utilities", value: "Underground" },
      { label: "Perimeter", value: "Compound wall" },
    ],
    amenities: [
      "Grand entrance arch",
      "40 ft & 33 ft CC internal roads",
      "Avenue plantation with paved footpaths",
      "Modern streetlights",
      "Underground water, electricity & drainage",
      "Landscaped open spaces",
      "Community seating areas",
      "Secure compound wall",
    ],
    distances: [
      { place: "Shankarpally railway station", distanceKm: 4, driveTime: "8 min" },
      { place: "Shankarpally town centre", distanceKm: 3, driveTime: "6 min" },
      { place: "Outer Ring Road (Exit 3)", distanceKm: 17, driveTime: "22 min" },
      { place: "IIT Hyderabad, Kandi", distanceKm: 20, driveTime: "28 min" },
      { place: "Financial District, Nanakramguda", distanceKm: 30, driveTime: "45 min" },
      { place: "Rajiv Gandhi International Airport", distanceKm: 57, driveTime: "65 min" },
    ],
    faqs: [
      {
        q: "Is Raghunath County DTCP approved?",
        a: "Yes. Raghunath County is a DTCP-approved layout. Approval documentation and title papers are available for legal verification before you book.",
      },
      {
        q: "Where exactly is Raghunath County located?",
        a: "The community faces the 100-feet Shankarpally to Mehtabkhan Guda–Mominpet main road, a few minutes from Shankarpally town and its railway station.",
      },
      {
        q: "What infrastructure is provided inside the layout?",
        a: "40-feet and 33-feet CC roads, modern streetlights, avenue plantation with footpaths, underground water, electricity and drainage lines, landscaped open spaces and a secure compound wall with a grand entrance arch.",
      },
      {
        q: "Is Raghunath County suitable for immediate construction?",
        a: "Yes — plots are ready-to-construct with utilities provisioned. Many buyers also hold plots as a medium-term investment while the Shankarpally corridor appreciates.",
      },
    ],
    accent: "#9c6b4a",
    metaTitle: "Raghunath County Shankarpally — 19-Acre DTCP Approved Villa Plots",
    metaDescription:
      "Raghunath County by Terravion: DTCP-approved villa plots across 19 acres facing the 100-ft Shankarpally–Mominpet road, with CC roads, underground utilities and gated security.",
    keywords: [
      "Raghunath County Shankarpally",
      "DTCP approved plots Shankarpally",
      "villa plots near Mominpet road",
      "open plots Shankarpally",
    ],
  },
  {
    slug: "mansanpally",
    name: "Terravion Mansanpally",
    shortName: "Mansanpally",
    approval: "Approvals in progress", // [PLACEHOLDER — replace with verified approval status]
    status: "upcoming",
    location: "Mansanpally, Southern Hyderabad growth corridor", // [PLACEHOLDER — verify exact survey location]
    acreage: "[Extent to be announced]", // [PLACEHOLDER — replace with verified acreage]
    plots: "[Plot count to be announced]", // [PLACEHOLDER]
    plotSizes: "[Plot sizes to be announced]", // [PLACEHOLDER]
    roads: "[Layout details to be announced]", // [PLACEHOLDER]
    priceFrom: "Pricing on request",
    headline: "The next chapter — south of the airport, ahead of the curve.",
    intro:
      "Terravion's upcoming plotted development at Mansanpally extends the portfolio into Hyderabad's southern growth corridor near the airport and the proposed Regional Ring Road alignment. Full masterplan, approvals and pricing will be announced; register your interest for launch-day access.",
    narrative: [
      "Mansanpally sits in the quadrant of Hyderabad that planners expect to move next: south of Rajiv Gandhi International Airport, threaded between the Srisailam highway and the proposed Regional Ring Road alignment, where pharma, aerospace and logistics investment is already staking ground.",
      "Terravion is assembling this next community with the same discipline as Sanctuary and Raghunath County — clear titles, statutory approvals before launch, and infrastructure laid before the first plot is handed over.",
      "Launch details — extent, plot sizes, masterplan and pricing — will be published here first. Registered buyers receive the masterplan and pre-launch pricing before public release.",
    ],
    highlights: [
      { label: "Corridor", value: "South Hyderabad" },
      { label: "Status", value: "Pre-launch" },
      { label: "Access", value: "Airport & RRR" },
      { label: "Titles", value: "Clear, verified" },
      { label: "Launch", value: "To be announced" },
      { label: "Registration", value: "Open" },
    ],
    amenities: [
      "Masterplan to be announced at launch",
      "Gated perimeter planned",
      "Internal CC road network planned",
      "Underground utilities planned",
      "Landscaped commons planned",
    ],
    distances: [
      { place: "Rajiv Gandhi International Airport", distanceKm: 20, driveTime: "30 min" },
      { place: "Srisailam Highway (NH-765)", distanceKm: 6, driveTime: "10 min" },
      { place: "TSIIC Pharma City zone", distanceKm: 15, driveTime: "22 min" },
      { place: "LB Nagar", distanceKm: 30, driveTime: "45 min" },
    ],
    faqs: [
      {
        q: "When does the Mansanpally project launch?",
        a: "The launch date will be announced once statutory approvals are in place. Registered buyers are notified first and receive pre-launch pricing.",
      },
      {
        q: "Why is Terravion developing in Mansanpally?",
        a: "Mansanpally sits in Hyderabad's southern growth corridor — near the airport, the Srisailam highway and the proposed Regional Ring Road — where large public and industrial investments are driving long-term land appreciation.",
      },
      {
        q: "How do I register interest for the Mansanpally launch?",
        a: "Use the Book a Site Visit form or WhatsApp us at +91 93472 59638. Registration is free and carries no obligation to purchase.",
      },
    ],
    accent: "#7d8471",
    metaTitle: "Terravion Mansanpally — Upcoming Plots Near Hyderabad Airport",
    metaDescription:
      "Terravion's upcoming plotted development at Mansanpally in South Hyderabad's airport–RRR growth corridor. Register for launch-day masterplan access and pre-launch pricing.",
    keywords: [
      "Mansanpally plots",
      "plots near Hyderabad airport",
      "upcoming plotted development Hyderabad south",
      "RRR corridor plots",
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
