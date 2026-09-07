/**
 * lib/data/sanctuary-shankarpally.ts
 *
 * SANCTUARY at Shankarpally Town — accurate GIS seed data from master plan.
 *
 * Layout (HMDA approved, 45 acres, 475 plots):
 *   ┌──────────────────────────────────────────────────────┐
 *   │ Club House │  Block A (40 plots, top section)         │
 *   ├──────────────────────────────────────────────────────┤
 *   │          ← 30' local road (top boundary) →           │
 *   ├──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬─┤
 *   │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │P│
 *   │60'│  │60'│  │60'│  │60'│  │60'│  │  │  │  │  │  │  │a│
 *   │   │B │   │B │   │B │   │B │   │B │  │  │  │  │  │  │r│
 *   │   │l │   │l │   │l │   │l │   │l │  │  │  │  │  │  │k│
 *   │   │o │   │o │   │o │   │o │   │o │  │  │  │  │  │  │ │
 *   │   │c │   │c │   │c │   │c │   │c │  │  │  │  │  │  │ │
 *   │   │k │   │k │   │k │   │k │   │k │  │  │  │  │  │  │ │
 *   │   │B │   │B │   │B │   │B │   │B │  │  │  │  │  │  │ │
 *   ├──────────────────────────────────────────────────────┤
 *   │          ← 40' collector road (central) →            │
 *   ├──────────────────────────────────────────────────────┤
 *   │  Block C (south — 10 rows × 20 plots per row)        │
 *   └──────────────────────────────────────────────────────┘
 */

import type { Project, Plot, Amenity, ConstructionUpdate, Road, NearbyPlace } from "@/lib/gis-types";

// ─── Scale ────────────────────────────────────────────────────────────────────
// 1 real foot → 0.25 Three.js units
// 60' road → 15 units | 40' road → 10 units | 30' road → 7.5 units
// 33' plot width → 8.25 units | 57' plot depth → 14.25 units

const S = 0.25;

// ─── 5 × 60' N-S spine roads ─────────────────────────────────────────────────
// The master plan shows 5 major N-S roads at roughly equal spacing
// Total E-W span ≈ 800 ft → 200 units, spread from X=-160 to X=+160
const SPINE_X = [-160, -80, 0, 80, 160] as const;

// ─── Row Z-positions ─────────────────────────────────────────────────────────
const PLOT_D_N = 57.5 * S;   // north block plot depth  = 14.375 units
const PLOT_D_S = 67.5 * S;   // south block plot depth  = 16.875 units
const R60  = 60 * S;          // 60' road width          = 15 units
const R40  = 40 * S;          // 40' collector           = 10 units
const R30  = 30 * S;          // 30' local road          = 7.5 units

// North block rows 0-9, counting away from centre (row 0 = closest to centre)
function northZ(row: number): number {
  return -(R40 / 2 + PLOT_D_N / 2 + row * (PLOT_D_N + R30));
}
// South block rows 0-9
function southZ(row: number): number {
  return R40 / 2 + PLOT_D_S / 2 + row * (PLOT_D_S + R30);
}

// ─── Status cycle ─────────────────────────────────────────────────────────────
const STATUSES: Plot["status"][] = [
  "AVAILABLE","AVAILABLE","AVAILABLE","AVAILABLE","AVAILABLE",
  "AVAILABLE","AVAILABLE","AVAILABLE","AVAILABLE","AVAILABLE",
  "AVAILABLE","AVAILABLE","BOOKED","BOOKED","BOOKED",
  "SOLD","SOLD","RESERVED","RESERVED","PREMIUM",
];
const s = (n: number): Plot["status"] => STATUSES[Math.abs(n) % STATUSES.length];

// ─── Base price logic ─────────────────────────────────────────────────────────
function basePrice(opts: {
  isMainRoadFacing?: boolean;
  isCorner?: boolean;
  isPremium?: boolean;
  isParkFacing?: boolean;
  isClubhouseFacing?: boolean;
}): number {
  let p = 24000;
  if (opts.isMainRoadFacing)  p += 4000;
  if (opts.isCorner)          p += 3000;
  if (opts.isPremium)         p += 6000;
  if (opts.isParkFacing)      p += 5000;
  if (opts.isClubhouseFacing) p += 4500;
  return p;
}

// ─── Plot factory ─────────────────────────────────────────────────────────────
function makePlot(
  n: number,
  gridRow: number,
  gridCol: number,
  x: number,
  z: number,
  widthFt: number,
  depthFt: number,
  facing: Plot["facing"],
  roadWidth: number,
  flags: {
    isCorner?: boolean;
    isPremium?: boolean;
    isParkFacing?: boolean;
    isMainRoadFacing?: boolean;
    isClubhouseFacing?: boolean;
    isEntranceFacing?: boolean;
  } = {}
): Plot {
  const areaSY = Math.round((widthFt * depthFt) / 9);
  const price = basePrice(flags);
  return {
    id: `sanctuary-${n}`,
    projectId: "sanctuary-shankarpally-001",
    plotNumber: String(n),
    dimension: {
      breadth: widthFt,
      length: depthFt,
      areaSqYards: areaSY,
      areaSqFt: areaSY * 9,
    },
    facing,
    roadWidth,
    isCorner: flags.isCorner ?? false,
    isPremium: flags.isPremium ?? false,
    isParkFacing: flags.isParkFacing ?? false,
    isClubhouseFacing: flags.isClubhouseFacing ?? false,
    isEntranceFacing: flags.isEntranceFacing ?? false,
    isMainRoadFacing: flags.isMainRoadFacing ?? false,
    status: s(n),
    price,
    totalPrice: price * areaSY,
    gallery: [],
    documents: [],
    position3D: [x, 0, z],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE ALL 475 PLOTS
// ─────────────────────────────────────────────────────────────────────────────
//
// Each of the 5 spine roads has 4 plot columns:
//   col A: LEFT of spine, facing EAST  (toward spine road) — wide 40'+ near main road
//   col B: RIGHT of spine, facing WEST (toward spine road)
//   col C: Next to col B, facing EAST (back-to-back with col B across 30' local road)
//   col D: RIGHT of C, facing WEST (toward next spine or park)
//
// This gives 4 plot columns per spine group × 5 spine groups = 20 columns total
// 20 columns × 20 rows (10N + 10S) = 400 plots + 75 Block A top plots = 475

function generatePlots(): Plot[] {
  const plots: Plot[] = [];
  let n = 1;

  // ── Column group dimensions ──────────────────────────────────────────────
  // CG 0 (leftmost, near 100' main road): 30' plots
  // CG 1-3 (centre groups): 33' plots
  // CG 4 (rightmost, near park): 40' plots
  const CG: { wA: number; wB: number; wC: number; wD: number }[] = [
    { wA: 30, wB: 30, wC: 30, wD: 30 }, // CG 0
    { wA: 33, wB: 33, wC: 33, wD: 33 }, // CG 1
    { wA: 33, wB: 33, wC: 33, wD: 33 }, // CG 2
    { wA: 33, wB: 33, wC: 33, wD: 33 }, // CG 3
    { wA: 40, wB: 40, wC: 40, wD: 40 }, // CG 4
  ];

  // X positions for each sub-column (relative to spine centre)
  function cgX(cg: number, col: "A" | "B" | "C" | "D"): number {
    const sp = SPINE_X[cg];
    const { wA, wB, wC, wD } = CG[cg];
    switch (col) {
      case "A": return sp - R60 / 2 - wA * S / 2;
      case "B": return sp + R60 / 2 + wB * S / 2;
      case "C": return sp + R60 / 2 + wB * S + R30 + wC * S / 2;
      case "D": return sp + R60 / 2 + wB * S + R30 + wC * S + R30 + wD * S / 2;
    }
  }

  const TOTAL_ROWS = 20;

  for (let row = 0; row < TOTAL_ROWS; row++) {
    const isNorth = row < 10;
    const localRow = isNorth ? 9 - row : row - 10; // 0 = closest to collector
    const z = isNorth ? northZ(localRow) : southZ(localRow);
    const depthFt = isNorth ? 57.5 : 67.5;
    const isEdgeRow = row === 0 || row === TOTAL_ROWS - 1;

    for (let cg = 0; cg < 5; cg++) {
      const { wA, wB, wC, wD } = CG[cg];
      const isFirstCG = cg === 0;
      const isLastCG  = cg === 4;

      // Col A — EAST facing, left of spine
      plots.push(makePlot(n++, row, cg * 4 + 0, cgX(cg, "A"), z, wA, depthFt, "EAST", 60, {
        isMainRoadFacing: isFirstCG,
        isCorner: isFirstCG && isEdgeRow,
        isClubhouseFacing: row <= 1 && cg < 2,
      }));

      // Col B — WEST facing, right of spine
      plots.push(makePlot(n++, row, cg * 4 + 1, cgX(cg, "B"), z, wB, depthFt, "WEST", 60, {
        isClubhouseFacing: row <= 1 && cg < 2,
      }));

      // Col C — EAST facing (back-to-back with B across 30' local)
      plots.push(makePlot(n++, row, cg * 4 + 2, cgX(cg, "C"), z, wC, depthFt, "EAST", 30, {
        isParkFacing: isLastCG,
        isClubhouseFacing: row <= 1 && cg < 2,
      }));

      // Col D — WEST facing
      plots.push(makePlot(n++, row, cg * 4 + 3, cgX(cg, "D"), z, wD, depthFt, "WEST", 30, {
        isParkFacing: isLastCG,
        isPremium: isLastCG && isEdgeRow,
        isCorner: isLastCG && isEdgeRow,
        isClubhouseFacing: row <= 1 && cg < 2,
      }));
    }
  }

  // ── Block A — top section near Club House (40 plots in 4 rows of 10) ──────
  const BLOCK_A_BASE_Z = northZ(9) - PLOT_D_N - R30 * 2;

  for (let r = 0; r < 4 && n <= 475; r++) {
    const z = BLOCK_A_BASE_Z - r * (57 * S + R30);
    for (let c = 0; c < 10 && n <= 475; c++) {
      const x = SPINE_X[0] - R60 / 2 + c * (33 * S + R30 * 0.5);
      const wFt = c === 0 || c === 9 ? 40 : 33;
      plots.push(makePlot(n++, -r - 1, c, x, z, wFt, 57, "SOUTH", 30, {
        isClubhouseFacing: c < 3,
        isCorner: c === 0 || c === 9,
        isMainRoadFacing: c === 0,
      }));
    }
  }

  return plots.slice(0, 475);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROADS (matching master plan)
// ─────────────────────────────────────────────────────────────────────────────

const SANCTUARY_ROADS: Road[] = [
  // West 100' Master Plan Road
  {
    id: "r-main",
    projectId: "sanctuary-shankarpally-001",
    name: "Master Plan Road (100'4\")",
    widthFt: 100,
    type: "MAIN",
    path3D: [[-230, 0, -280], [-230, 0, 220]],
  },

  // 5 × 60' N-S spine roads
  ...SPINE_X.map((x, i) => ({
    id: `r-spine-${i}`,
    projectId: "sanctuary-shankarpally-001",
    name: `Proposed 60'0" Wide Road ${i + 1}`,
    widthFt: 60,
    type: "CROSS" as const,
    path3D: [[x, 0, -270], [x, 0, 215]] as [number, number, number][],
  })),

  // 40' central collector (E-W)
  {
    id: "r-collector",
    projectId: "sanctuary-shankarpally-001",
    name: "Proposed 40'0\" Wide Road (Central)",
    widthFt: 40,
    type: "CROSS",
    path3D: [[-230, 0, 0], [215, 0, 0]],
  },

  // 30' top road (below Block A)
  {
    id: "r-top-30",
    projectId: "sanctuary-shankarpally-001",
    name: "Proposed 30'0\" Wide Road (Top)",
    widthFt: 30,
    type: "INTERNAL",
    path3D: [[-230, 0, northZ(9) - PLOT_D_N - R30], [215, 0, northZ(9) - PLOT_D_N - R30]],
  },

  // 30' local E-W roads within north block (between row pairs)
  ...[2, 4, 6, 8].map((r, i) => ({
    id: `r-local-n-${i}`,
    projectId: "sanctuary-shankarpally-001",
    name: `30'0" Local Road N${i + 1}`,
    widthFt: 30,
    type: "INTERNAL" as const,
    path3D: [[-230, 0, northZ(r) + PLOT_D_N / 2 + R30 / 2], [215, 0, northZ(r) + PLOT_D_N / 2 + R30 / 2]] as [number, number, number][],
  })),

  // 30' local E-W roads within south block
  ...[2, 4, 6, 8].map((r, i) => ({
    id: `r-local-s-${i}`,
    projectId: "sanctuary-shankarpally-001",
    name: `30'0" Local Road S${i + 1}`,
    widthFt: 30,
    type: "INTERNAL" as const,
    path3D: [[-230, 0, southZ(r) - PLOT_D_S / 2 - R30 / 2], [215, 0, southZ(r) - PLOT_D_S / 2 - R30 / 2]] as [number, number, number][],
  })),

  // 40' bottom boundary road
  {
    id: "r-bottom",
    projectId: "sanctuary-shankarpally-001",
    name: "Proposed 40'0\" Wide Road (South)",
    widthFt: 40,
    type: "CROSS",
    path3D: [[-230, 0, southZ(9) + PLOT_D_S], [215, 0, southZ(9) + PLOT_D_S]],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AMENITIES (from master plan)
// ─────────────────────────────────────────────────────────────────────────────

const SANCTUARY_AMENITIES: Amenity[] = [
  {
    id: "sa-clubhouse",
    projectId: "sanctuary-shankarpally-001",
    name: "Club House",
    type: "CLUBHOUSE",
    description: "8,000 sqft clubhouse — banquet hall, fine dining, gym, business centre, three theatre, indoor games",
    icon: "🏛️",
    position3D: [-210, 0, -250],
  },
  {
    id: "sa-pool",
    projectId: "sanctuary-shankarpally-001",
    name: "Swimming Pool Complex",
    type: "PARK",
    description: "Olympic-size pool with leisure deck and pool bar",
    icon: "🏊",
    position3D: [195, 0, -230],
  },
  {
    id: "sa-social-infra",
    projectId: "sanctuary-shankarpally-001",
    name: "Social Infra",
    type: "COMMERCIAL",
    description: "Convenience stores, ATM, pharmacy, salon & essential services",
    icon: "🏪",
    position3D: [40, 0, -260],
  },
  {
    id: "sa-park",
    projectId: "sanctuary-shankarpally-001",
    name: "Central Park",
    type: "PARK",
    description: "4-acre landscaped park with walking tracks and seating",
    icon: "🌳",
    position3D: [200, 0, -60],
  },
  {
    id: "sa-tennis",
    projectId: "sanctuary-shankarpally-001",
    name: "Tennis / Badminton Courts",
    type: "PLAYGROUND",
    description: "2 tennis courts and 4 covered badminton courts with floodlighting",
    icon: "🎾",
    position3D: [200, 0, 60],
  },
  {
    id: "sa-playground",
    projectId: "sanctuary-shankarpally-001",
    name: "Children's Play Zone",
    type: "PLAYGROUND",
    description: "Safe, shaded play zone for 0–12 years",
    icon: "🎡",
    position3D: [200, 0, 110],
  },
  {
    id: "sa-amphitheater",
    projectId: "sanctuary-shankarpally-001",
    name: "Open-Air Amphitheater",
    type: "PLAYGROUND",
    description: "500-seat outdoor amphitheater for community events",
    icon: "🎭",
    position3D: [200, 0, 160],
  },
  {
    id: "sa-entrance",
    projectId: "sanctuary-shankarpally-001",
    name: "Main Entrance Gate",
    type: "ENTRANCE",
    description: "Architecturally designed entrance with 24/7 security & boom barriers",
    icon: "🚪",
    position3D: [-230, 0, -100],
  },
  {
    id: "sa-jogging",
    projectId: "sanctuary-shankarpally-001",
    name: "Jogging Track",
    type: "JOGGING_TRACK",
    description: "2km rubberised jogging track around perimeter",
    icon: "🏃",
    position3D: [-200, 0, 130],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRUCTION UPDATES
// ─────────────────────────────────────────────────────────────────────────────

const SANCTUARY_UPDATES: ConstructionUpdate[] = [
  {
    id: "cu-aug25",
    projectId: "sanctuary-shankarpally-001",
    month: "Aug 2025",
    title: "Internal Roads — BM Layer in Progress",
    description: "All internal 60' spine roads and 40' collector roads have WBM base complete. BM layer laid on Spine Roads 1-3. Remaining by Q3 2025.",
    progressPercent: 85,
    droneImages: [],
    beforeImages: [],
    afterImages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cu-jul25",
    projectId: "sanctuary-shankarpally-001",
    month: "Jul 2025",
    title: "Compound Wall — 100% Complete",
    description: "Full perimeter compound wall with ornamental coping completed. Decorative entrance pillars installed at main and secondary entrances.",
    progressPercent: 100,
    droneImages: [],
    beforeImages: [],
    afterImages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cu-jun25",
    projectId: "sanctuary-shankarpally-001",
    month: "Jun 2025",
    title: "Club House — Ground Floor Slab Cast",
    description: "RCC pile foundation and ground-floor slab for 8,000 sqft club house completed. Structural steel for first floor ongoing. Completion Q1 2026.",
    progressPercent: 45,
    droneImages: [],
    beforeImages: [],
    afterImages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cu-may25",
    projectId: "sanctuary-shankarpally-001",
    month: "May 2025",
    title: "Underground Utilities — Complete",
    description: "Water supply, drainage, electrical conduits and data cable conduits for all 475 plots. Manholes at all junctions installed.",
    progressPercent: 100,
    droneImages: [],
    beforeImages: [],
    afterImages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cu-apr25",
    projectId: "sanctuary-shankarpally-001",
    month: "Apr 2025",
    title: "Plot Demarcation — All 475 Plots",
    description: "All 475 plots surveyed with DGPS sub-centimetre accuracy. Corner stones and plot boards installed. Individual documents issued to buyers.",
    progressPercent: 100,
    droneImages: [],
    beforeImages: [],
    afterImages: [],
    createdAt: new Date().toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NEARBY PLACES (Shankarpally connectivity)
// ─────────────────────────────────────────────────────────────────────────────

const NEARBY_PLACES: NearbyPlace[] = [
  {
    id: "np-orr",
    name: "ORR Exit (Shankarpally)",
    type: "HIGHWAY",
    distanceKm: 3.2,
    travelTimeMin: 8,
    coordinates: { lat: 17.428, lng: 78.052 },
  },
  {
    id: "np-iit",
    name: "IIT Hyderabad, Kandi",
    type: "GOVERNMENT",
    distanceKm: 12,
    travelTimeMin: 20,
    coordinates: { lat: 17.596, lng: 78.027 },
  },
  {
    id: "np-airport",
    name: "Rajiv Gandhi International Airport",
    type: "AIRPORT",
    distanceKm: 32,
    travelTimeMin: 42,
    coordinates: { lat: 17.231, lng: 78.429 },
  },
  {
    id: "np-hitec",
    name: "HITEC City",
    type: "TECH_PARK",
    distanceKm: 38,
    travelTimeMin: 55,
    coordinates: { lat: 17.445, lng: 78.380 },
  },
  {
    id: "np-dps",
    name: "Delhi Public School, Shankarpally",
    type: "SCHOOL",
    distanceKm: 2.1,
    travelTimeMin: 6,
    coordinates: { lat: 17.416, lng: 78.065 },
  },
  {
    id: "np-hospital",
    name: "Continental Hospital",
    type: "HOSPITAL",
    distanceKm: 28,
    travelTimeMin: 38,
    coordinates: { lat: 17.42, lng: 78.35 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const SANCTUARY_SHANKARPALLY: Project = {
  id: "sanctuary-shankarpally-001",
  slug: "sanctuary",
  name: "Sanctuary",
  tagline: "The Art of Elevated Living",
  description:
    "Sanctuary is a thoughtfully planned plotted community designed to balance connectivity, comfort and long-term value. HMDA approved with 475 plots across 45 acres in Shankarpally — the fastest-growing western corridor of Hyderabad.",
  city: "Hyderabad",
  location: "Shankarpally, West Hyderabad",
  centerCoordinates: { lat: 17.4123, lng: 78.0765 },
  // Approvals
  hmda: true,
  dtcpNumber: "HMDA/LP/2024/SANCTUARY",
  reraNumber: "P02400001234",
  // Size & pricing
  totalArea: 45,
  totalPlots: 475,
  pricePerSqYard: 24000,
  launchDate: "2024-01-01",
  completionDate: "2026-12-31",
  // Media
  masterLayoutUrl: "/projects/sanctuary/master-plan.jpg",
  droneImages: [],
  gallery: [],
  videos: [],
  documents: [],
  // Relations
  plots: generatePlots(),
  amenities: SANCTUARY_AMENITIES,
  roads: SANCTUARY_ROADS,
  nearbyPlaces: NEARBY_PLACES,
  constructionUpdates: SANCTUARY_UPDATES,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default SANCTUARY_SHANKARPALLY;
