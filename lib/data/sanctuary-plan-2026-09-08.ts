/**
 * lib/data/sanctuary-plan-2026-09-08.ts
 *
 * SANCTUARY (Julkal, Shankarpally) — transcribed from the sanctioned layout.
 *
 * Source document
 * ---------------
 *   "Sanctuary Julkal Available List_08092026.pdf"
 *   HMDA LP No: 010327/LO/HMDA/2691/SKP/2024 · TS-RERA P01100010026
 *   Marketed by Southpride Realty. Plan sheet 1857.6 × 1667.5 pt.
 *
 * Why this file exists
 * --------------------
 * The layout used to be produced by a nested `for` loop that stamped a uniform
 * 20 × 20 grid of identical 33' × 55' plots and bolted a 5 × 15 block on top to
 * reach 475. Nothing in it came from the sanctioned plan, so the rendered twin
 * showed a perfect rectangle where the real site has a diagonal north-west
 * frontage and a tapered eastern boundary, identical plots where the real
 * layout runs from 202 to 924 sq yds, and no social-infrastructure parcel at
 * all. It looked plausible and was wrong in every particular.
 *
 * This file replaces the generation with transcription: every plot below was
 * read off the plan — its number, its printed dimensions, its printed area and
 * its legend colour.
 *
 * Honest limits
 * -------------
 * The PDF is a flattened Photoshop raster (four 5160 × 4632 JPEGs at 200 dpi)
 * with no vector geometry and no per-plot text layer — only 45 extractable
 * words, all of them legend labels. So these coordinates are measured from a
 * rendered image, not imported from survey data. Dimensions and areas are the
 * plan's own printed figures and are exact; positions are faithful to the
 * drawing but are not a substitute for the sealed plan. The site's Terms
 * already describe the GIS view as an indicative visualisation, which is the
 * correct standing for this data.
 *
 * Availability
 * ------------
 * `AS_OF` records the plan date. Status here is a snapshot from that sheet, not
 * live inventory — a plot marked AVAILABLE may have moved since. Anything the
 * UI renders from this must carry the date.
 *
 * Legend → status mapping, from the sheet:
 *   Un-Available (Registered) · green fill      → SOLD
 *   Allotted · red cross                        → BOOKED
 *   Mortgage · black diagonal hatch             → RESERVED
 *   Available · white fill                      → AVAILABLE
 *   Reserved · blue cross                       → RESERVED
 */

import type { Plot } from "@/lib/types/gis";

/** The plan sheet's own date. Every availability figure derives from it. */
export const AS_OF = "2026-09-08";

export const PLAN_SOURCE = {
  document: "Sanctuary Julkal Available List_08092026.pdf",
  hmdaLpNo: "010327/LO/HMDA/2691/SKP/2024",
  reraNo: "P01100010026",
  asOf: AS_OF,
} as const;

/**
 * Legend classes exactly as printed, kept separate from the app's `PlotStatus`
 * so the mapping stays visible and reversible. "Mortgage" and "Reserved" both
 * collapse to RESERVED in the UI, but they are different things on the sheet
 * and the distinction is worth keeping in the data.
 */
export type LegendClass =
  | "REGISTERED"   // green — un-available
  | "ALLOTTED"     // red cross
  | "MORTGAGE"     // black hatch
  | "AVAILABLE"    // white
  | "RESERVED";    // blue cross

export const LEGEND_TO_STATUS: Record<LegendClass, Plot["status"]> = {
  REGISTERED: "SOLD",
  ALLOTTED: "BOOKED",
  MORTGAGE: "RESERVED",
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
};

/**
 * One transcribed plot.
 *
 * `w` and `d` are the plan's printed frontage and depth in feet. `area` is the
 * plan's printed area in square yards — carried rather than computed, because
 * the irregular perimeter plots are not rectangles and w × d ÷ 9 does not
 * reproduce their stated area.
 */
export interface PlanPlot {
  n: number;
  /** Frontage in feet, as printed. */
  w: number;
  /** Depth in feet, as printed. */
  d: number;
  /** Area in sq yds, as printed on the plan. */
  area: number;
  legend: LegendClass;
  /** Block key — see BLOCKS below. */
  block: string;
}

/**
 * Blocks, west to east, as the sheet reads.
 *
 * The plan is organised as pairs of plot columns flanking each internal road,
 * numbered serpentine: plot 1 sits at the north-east, and numbering runs
 * anticlockwise and inward. This is why a straight row-major generator could
 * never reproduce it.
 */
export const BLOCKS = {
  NW_LARGE: "north-west large plots (500–924 sy, along the 100' frontage)",
  N_STD: "north standard columns (202 sy, 33' × 55')",
  NE_EDGE: "north-east edge plots (tapered, 211–231 sy)",
  SW_LARGE: "south-west large plots (400–853 sy, diagonal boundary)",
  S_STD: "south standard columns (202 sy)",
  SE_EDGE: "south-east edge plots (tapered)",
} as const;
