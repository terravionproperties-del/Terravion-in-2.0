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

import type { Project, Plot, Amenity, ConstructionUpdate, Road, NearbyPlace } from "@/lib/types/gis";

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

// ─── Official Status Map (from Sanctuary Julkal Available List 08/09/2026) ───
// Breakdown: 114 Available | 84 Booked (Allotted) | 193 Sold (Registered) | 84 Reserved (Mortgage/Office)
const SANCTUARY_AVAILABILITY_MAP: Record<number, Plot["status"]> = {
  1: "AVAILABLE", 2: "AVAILABLE", 3: "AVAILABLE", 4: "AVAILABLE", 5: "AVAILABLE", 6: "AVAILABLE", 7: "AVAILABLE", 8: "AVAILABLE",
  9: "AVAILABLE", 10: "AVAILABLE", 11: "AVAILABLE", 12: "AVAILABLE", 13: "AVAILABLE", 14: "AVAILABLE", 15: "BOOKED", 16: "SOLD",
  17: "SOLD", 18: "AVAILABLE", 19: "AVAILABLE", 20: "SOLD", 21: "BOOKED", 22: "AVAILABLE", 23: "AVAILABLE", 24: "BOOKED",
  25: "SOLD", 26: "AVAILABLE", 27: "AVAILABLE", 28: "BOOKED", 29: "SOLD", 30: "SOLD", 31: "SOLD", 32: "SOLD",
  33: "BOOKED", 34: "BOOKED", 35: "SOLD", 36: "BOOKED", 37: "SOLD", 38: "SOLD", 39: "SOLD", 40: "RESERVED",
  41: "RESERVED", 42: "RESERVED", 43: "RESERVED", 44: "RESERVED", 45: "RESERVED", 46: "RESERVED", 47: "RESERVED", 48: "RESERVED",
  49: "RESERVED", 50: "RESERVED", 51: "RESERVED", 52: "RESERVED", 53: "RESERVED", 54: "RESERVED", 55: "RESERVED", 56: "RESERVED",
  57: "RESERVED", 58: "RESERVED", 59: "RESERVED", 60: "RESERVED", 61: "RESERVED", 62: "RESERVED", 63: "RESERVED", 64: "RESERVED",
  65: "RESERVED", 66: "RESERVED", 67: "RESERVED", 68: "RESERVED", 69: "RESERVED", 70: "RESERVED", 71: "RESERVED", 72: "RESERVED",
  73: "RESERVED", 74: "RESERVED", 75: "RESERVED", 76: "RESERVED", 77: "RESERVED", 78: "RESERVED", 79: "RESERVED", 80: "SOLD",
  81: "SOLD", 82: "SOLD", 83: "SOLD", 84: "SOLD", 85: "SOLD", 86: "SOLD", 87: "SOLD", 88: "SOLD",
  89: "SOLD", 90: "SOLD", 91: "SOLD", 92: "SOLD", 93: "SOLD", 94: "SOLD", 95: "SOLD", 96: "SOLD",
  97: "SOLD", 98: "SOLD", 99: "SOLD", 100: "SOLD", 101: "SOLD", 102: "SOLD", 103: "SOLD", 104: "SOLD",
  105: "SOLD", 106: "SOLD", 107: "SOLD", 108: "BOOKED", 109: "AVAILABLE", 110: "AVAILABLE", 111: "SOLD", 112: "SOLD",
  113: "BOOKED", 114: "SOLD", 115: "SOLD", 116: "SOLD", 117: "BOOKED", 118: "SOLD", 119: "SOLD", 120: "SOLD",
  121: "SOLD", 122: "SOLD", 123: "SOLD", 124: "SOLD", 125: "BOOKED", 126: "AVAILABLE", 127: "AVAILABLE", 128: "AVAILABLE",
  129: "SOLD", 130: "BOOKED", 131: "SOLD", 132: "SOLD", 133: "BOOKED", 134: "SOLD", 135: "AVAILABLE", 136: "AVAILABLE",
  137: "BOOKED", 138: "BOOKED", 139: "SOLD", 140: "SOLD", 141: "SOLD", 142: "SOLD", 143: "SOLD", 144: "BOOKED",
  145: "SOLD", 146: "SOLD", 147: "SOLD", 148: "BOOKED", 149: "SOLD", 150: "BOOKED", 151: "BOOKED", 152: "BOOKED",
  153: "AVAILABLE", 154: "AVAILABLE", 155: "SOLD", 156: "BOOKED", 157: "SOLD", 158: "SOLD", 159: "SOLD", 160: "SOLD",
  161: "SOLD", 162: "SOLD", 163: "SOLD", 164: "SOLD", 165: "BOOKED", 166: "BOOKED", 167: "SOLD", 168: "SOLD",
  169: "BOOKED", 170: "BOOKED", 171: "BOOKED", 172: "SOLD", 173: "SOLD", 174: "BOOKED", 175: "SOLD", 176: "BOOKED",
  177: "SOLD", 178: "SOLD", 179: "SOLD", 180: "BOOKED", 181: "BOOKED", 182: "BOOKED", 183: "SOLD", 184: "SOLD",
  185: "SOLD", 186: "BOOKED", 187: "SOLD", 188: "SOLD", 189: "BOOKED", 190: "BOOKED", 191: "SOLD", 192: "SOLD",
  193: "SOLD", 194: "SOLD", 195: "SOLD", 196: "SOLD", 197: "SOLD", 198: "SOLD", 199: "SOLD", 200: "SOLD",
  201: "SOLD", 202: "SOLD", 203: "BOOKED", 204: "BOOKED", 205: "BOOKED", 206: "BOOKED", 207: "BOOKED", 208: "BOOKED",
  209: "AVAILABLE", 210: "BOOKED", 211: "SOLD", 212: "BOOKED", 213: "BOOKED", 214: "SOLD", 215: "BOOKED", 216: "SOLD",
  217: "BOOKED", 218: "BOOKED", 219: "SOLD", 220: "SOLD", 221: "SOLD", 222: "RESERVED", 223: "RESERVED", 224: "SOLD",
  225: "SOLD", 226: "SOLD", 227: "SOLD", 228: "SOLD", 229: "SOLD", 230: "SOLD", 231: "SOLD", 232: "SOLD",
  233: "SOLD", 234: "SOLD", 235: "SOLD", 236: "SOLD", 237: "SOLD", 238: "SOLD", 239: "AVAILABLE", 240: "AVAILABLE",
  241: "BOOKED", 242: "BOOKED", 243: "BOOKED", 244: "SOLD", 245: "BOOKED", 246: "BOOKED", 247: "AVAILABLE", 248: "SOLD",
  249: "AVAILABLE", 250: "SOLD", 251: "SOLD", 252: "SOLD", 253: "SOLD", 254: "SOLD", 255: "SOLD", 256: "SOLD",
  257: "SOLD", 258: "SOLD", 259: "SOLD", 260: "SOLD", 261: "SOLD", 262: "SOLD", 263: "SOLD", 264: "AVAILABLE",
  265: "AVAILABLE", 266: "SOLD", 267: "AVAILABLE", 268: "AVAILABLE", 269: "AVAILABLE", 270: "AVAILABLE", 271: "SOLD", 272: "SOLD",
  273: "BOOKED", 274: "AVAILABLE", 275: "AVAILABLE", 276: "AVAILABLE", 277: "SOLD", 278: "AVAILABLE", 279: "AVAILABLE", 280: "SOLD",
  281: "BOOKED", 282: "SOLD", 283: "BOOKED", 284: "SOLD", 285: "SOLD", 286: "SOLD", 287: "SOLD", 288: "BOOKED",
  289: "BOOKED", 290: "BOOKED", 291: "BOOKED", 292: "AVAILABLE", 293: "AVAILABLE", 294: "AVAILABLE", 295: "AVAILABLE", 296: "AVAILABLE",
  297: "BOOKED", 298: "BOOKED", 299: "BOOKED", 300: "SOLD", 301: "SOLD", 302: "SOLD", 303: "SOLD", 304: "SOLD",
  305: "BOOKED", 306: "SOLD", 307: "BOOKED", 308: "AVAILABLE", 309: "AVAILABLE", 310: "AVAILABLE", 311: "SOLD", 312: "SOLD",
  313: "AVAILABLE", 314: "AVAILABLE", 315: "BOOKED", 316: "BOOKED", 317: "BOOKED", 318: "BOOKED", 319: "BOOKED", 320: "AVAILABLE",
  321: "AVAILABLE", 322: "BOOKED", 323: "BOOKED", 324: "SOLD", 325: "SOLD", 326: "SOLD", 327: "SOLD", 328: "SOLD",
  329: "AVAILABLE", 330: "BOOKED", 331: "SOLD", 332: "SOLD", 333: "AVAILABLE", 334: "SOLD", 335: "SOLD", 336: "SOLD",
  337: "SOLD", 338: "SOLD", 339: "SOLD", 340: "SOLD", 341: "AVAILABLE", 342: "AVAILABLE", 343: "AVAILABLE", 344: "AVAILABLE",
  345: "AVAILABLE", 346: "SOLD", 347: "SOLD", 348: "AVAILABLE", 349: "AVAILABLE", 350: "AVAILABLE", 351: "AVAILABLE", 352: "SOLD",
  353: "SOLD", 354: "AVAILABLE", 355: "AVAILABLE", 356: "AVAILABLE", 357: "BOOKED", 358: "BOOKED", 359: "SOLD", 360: "BOOKED",
  361: "BOOKED", 362: "SOLD", 363: "SOLD", 364: "SOLD", 365: "SOLD", 366: "AVAILABLE", 367: "AVAILABLE", 368: "AVAILABLE",
  369: "AVAILABLE", 370: "AVAILABLE", 371: "AVAILABLE", 372: "AVAILABLE", 373: "AVAILABLE", 374: "BOOKED", 375: "SOLD", 376: "BOOKED",
  377: "SOLD", 378: "BOOKED", 379: "BOOKED", 380: "BOOKED", 381: "BOOKED", 382: "SOLD", 383: "SOLD", 384: "SOLD",
  385: "AVAILABLE", 386: "AVAILABLE", 387: "AVAILABLE", 388: "AVAILABLE", 389: "AVAILABLE", 390: "SOLD", 391: "SOLD", 392: "AVAILABLE",
  393: "AVAILABLE", 394: "SOLD", 395: "AVAILABLE", 396: "AVAILABLE", 397: "AVAILABLE", 398: "AVAILABLE", 399: "AVAILABLE", 400: "SOLD",
  401: "AVAILABLE", 402: "AVAILABLE", 403: "AVAILABLE", 404: "AVAILABLE", 405: "SOLD", 406: "SOLD", 407: "AVAILABLE", 408: "AVAILABLE",
  409: "AVAILABLE", 410: "AVAILABLE", 411: "SOLD", 412: "AVAILABLE", 413: "AVAILABLE", 414: "AVAILABLE", 415: "AVAILABLE", 416: "AVAILABLE",
  417: "SOLD", 418: "BOOKED", 419: "BOOKED", 420: "RESERVED", 421: "RESERVED", 422: "RESERVED", 423: "RESERVED", 424: "RESERVED",
  425: "RESERVED", 426: "RESERVED", 427: "RESERVED", 428: "RESERVED", 429: "RESERVED", 430: "RESERVED", 431: "RESERVED", 432: "RESERVED",
  433: "RESERVED", 434: "RESERVED", 435: "RESERVED", 436: "RESERVED", 437: "RESERVED", 438: "RESERVED", 439: "RESERVED", 440: "RESERVED",
  441: "RESERVED", 442: "RESERVED", 443: "RESERVED", 444: "RESERVED", 445: "RESERVED", 446: "RESERVED", 447: "RESERVED", 448: "RESERVED",
  449: "RESERVED", 450: "RESERVED", 451: "RESERVED", 452: "RESERVED", 453: "RESERVED", 454: "RESERVED", 455: "RESERVED", 456: "RESERVED",
  457: "RESERVED", 458: "RESERVED", 459: "RESERVED", 460: "RESERVED", 461: "RESERVED", 462: "SOLD", 463: "SOLD", 464: "AVAILABLE",
  465: "AVAILABLE", 466: "AVAILABLE", 467: "AVAILABLE", 468: "AVAILABLE", 469: "AVAILABLE", 470: "AVAILABLE", 471: "AVAILABLE", 472: "AVAILABLE",
  473: "BOOKED", 474: "AVAILABLE", 475: "SOLD",
};

const s = (n: number): Plot["status"] => SANCTUARY_AVAILABILITY_MAP[n] ?? "AVAILABLE";

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
  dtcpNumber: "010327/LO/HMDA/2691SKP/2024",
  reraNumber: "P01100010026",
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
