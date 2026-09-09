/**
 * THE TERRAVION FILM — scroll choreography.
 *
 * The source reel is a single continuous 90-second shot (2160 frames @ 24fps,
 * 3840×2160). It already carries its own baked-in typography for roughly 40%
 * of its runtime. Everything below is authored against that reality:
 *
 *   · `BAKED` lists the frame ranges where the film speaks for itself. No
 *     overlay may ever intersect these — the film's own type is the design.
 *   · Every scene sits inside a verified CLEAN window, and its `anchor` is
 *     chosen from the composition of that window: text never lands on the
 *     presenter, on moving people, on signage, or on high-detail architecture.
 *   · `focusX` is the horizontal point the canvas keeps when the viewport is
 *     narrower than 16:9, so portrait crops toward the subject instead of
 *     blindly centre-cropping.
 *
 * Frame numbers are ORIGINAL source frames (1–2160). Asset tiers are decimated
 * (see FILM_TIERS); `frameToIndex` maps between them.
 */

export const TOTAL_FRAMES = 2160;
export const FPS = 24;

/**
 * The reel fades up from black and back down to it. Scroll is mapped to the
 * lit portion only — landing on a black screen reads as a broken page, and
 * spending scroll on an empty frame is scroll spent on nothing.
 */
export const FILM_IN = 34;
/*
 * 2112, not 2136.
 *
 * The tail of the reel was deleted from `public/film` — the closing card
 * carried garbled AI text (a fabricated email and phone number). hd now ends
 * at index 1058 and sd at 530, so anything past ~2116 requests a file that no
 * longer exists. Ending the scroll at 2112 keeps both tiers inside what is
 * actually on disk, with a couple of frames of margin.
 */
export const FILM_OUT = 2112;

/** Scroll progress (0–1) → original frame number. */
export function progressToFrame(p: number): number {
  return FILM_IN + Math.min(1, Math.max(0, p)) * (FILM_OUT - FILM_IN);
}

/** Original frame number → scroll progress (0–1). */
export function frameToProgress(frame: number): number {
  return Math.min(1, Math.max(0, (frame - FILM_IN) / (FILM_OUT - FILM_IN)));
}

export const FILM_TIERS = {
  hd: { dir: "/film/hd", step: 2, count: 1058, width: 1600, height: 900 },
  sd: { dir: "/film/sd", step: 4, count: 530, width: 960, height: 540 },
} as const;

export type TierName = keyof typeof FILM_TIERS;

/** Original frame number → 1-based file index within a tier. */
export function frameToIndex(frame: number, tier: TierName): number {
  const { step, count } = FILM_TIERS[tier];
  return Math.min(count, Math.max(1, Math.round(frame / step)));
}

export function frameUrl(index: number, tier: TierName): string {
  return `${FILM_TIERS[tier].dir}/f${String(index).padStart(4, "0")}.webp`;
}

/**
 * Ranges where the reel displays its own typography. Overlays are forbidden
 * here — competing type is the fastest way to look like a template.
 */
export const BAKED: [number, number][] = [
  [55, 238],    // "Welcome to Terravion Properties" + presenter
  [322, 382],   // skyline with location pins
  [418, 472],   // "Welcome to Shankarpally"
  [598, 742],   // "Three premium communities" + Raghunath County badge
  [843, 938],   // "Raghunath County — DTCP Approved…" specification list
  [1043, 1215], // "Sanctuary — The Art of Elevated Living", then the smaller
  //               "Premium Township" label that rides on until ~1210
  [1383, 1502], // "Mansanpally" + community labels
  [1563, 1702], // "One Vision / Three Landmark Communities" + logo
  [1702, 1828], // "Connected · Growing · Future Ready"
  [2008, 2108], // "Your Future Begins Here" + presenter
];

export type Anchor =
  | "left"
  | "right"
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "centre";

export type Scrim = "left" | "right" | "bottom" | "radial" | "top" | "none";

export interface FilmScene {
  id: string;
  /** first / last ORIGINAL frame this overlay is alive for */
  in: number;
  out: number;
  anchor: Anchor;
  scrim: Scrim;
  /** horizontal focal point (0–1) used when cropping to narrow viewports */
  focusX?: number;
  kicker?: string;
  title: string;
  lead?: string;
  /** small factual row — reads as a plaque, not a stat card */
  facts?: { label: string; value: string }[];
  link?: { href: string; label: string };
  /** typography travels with the camera (px across the scene's life) */
  drift?: { x: number; y: number };
}

/**
 * Ten overlay beats. Each one verified against the footage: see the comment
 * above it for what is actually on screen and why the anchor is safe.
 */
export const SCENES: FilmScene[] = [
  {
    // f240–320 · interior glass wall, Hyderabad skyline beyond. Towers occupy
    // the centre-right; the lower-left glass is dark and empty.
    id: "west",
    in: 246,
    out: 318,
    anchor: "bottom-left",
    scrim: "bottom",
    focusX: 0.5,
    kicker: "Hyderabad, moving west",
    title: "The city has been\nheading this way\nfor a decade.",
    drift: { x: 0, y: -34 },
  },
  {
    // f386–414 · sunset highway aerial. Road and lake fill the lower two
    // thirds; the upper-left sky is clean and unbroken.
    id: "corridor",
    in: 386,
    out: 414,
    anchor: "top-left",
    scrim: "top",
    focusX: 0.5,
    kicker: "The corridor",
    title: "Forty minutes\nfrom the\nFinancial District.",
    drift: { x: 0, y: 26 },
  },
  {
    // f480–590 · open green landscape, boundary gate low in frame. Sky and
    // upper field are empty; keep type left, away from the gate.
    id: "shankarpally",
    in: 484,
    out: 590,
    anchor: "left",
    scrim: "left",
    focusX: 0.45,
    kicker: "Shankarpally",
    title: "Where the land\nstill breathes.",
    lead: "Rail, ring road and IIT Hyderabad within reach — and ground that has not yet been priced like the city.",
    link: { href: "/locations/shankarpally", label: "The location study" },
    drift: { x: -22, y: 0 },
  },
  {
    // f748–838 · entrance gate architecture, then a street where residents
    // and cyclists enter from the RIGHT. Type stays hard left.
    id: "discipline",
    in: 748,
    out: 838,
    anchor: "left",
    scrim: "left",
    focusX: 0.38,
    kicker: "The discipline",
    title: "Approved before\na single plot\nis sold.",
    lead: "HMDA and DTCP sanction in hand, titles open to your own lawyer, infrastructure laid before handover.",
    drift: { x: -18, y: -10 },
  },
  {
    // f944–1002 · inside cloud. The softest, emptiest frames in the reel and
    // the one place a centred statement can breathe. Deliberately ends before
    // f1008, where the Sanctuary gate rises into the middle of the frame.
    id: "manifesto",
    in: 944,
    out: 1002,
    anchor: "centre",
    scrim: "radial",
    focusX: 0.5,
    title: "Two communities.\nSixty-four acres.\nOne standard.",
    drift: { x: 0, y: -30 },
  },
  {
    // f1272–1326 · the film runs its own "Sanctuary" title card over the
    // clubhouse at f1043–1215, so this beat waits until the reel goes quiet
    // and lands on the open plotted land beyond it. Left third is open field.
    id: "sanctuary",
    in: 1272,
    out: 1326,
    anchor: "left",
    scrim: "left",
    focusX: 0.5,
    kicker: "Sanctuary · HMDA approved",
    title: "A clubhouse\nthat opens with\nthe community.",
    facts: [
      { label: "Extent", value: "45 acres" },
      { label: "Clubhouse", value: "25,000 sq ft" },
    ],
    link: { href: "/projects/sanctuary", label: "Enter Sanctuary" },
    drift: { x: 20, y: -12 },
  },
  {
    // f1334–1376 · the boulevard with villas either side. Ends before f1383,
    // where the reel's own "Mansanpally" card comes up.
    id: "plots",
    in: 1334,
    out: 1376,
    anchor: "bottom-left",
    scrim: "bottom",
    focusX: 0.5,
    kicker: "The plots",
    title: "202 to 750\nsquare yards.",
    facts: [
      { label: "Vaastu", value: "100% compliant" },
      { label: "Utilities", value: "Underground" },
      { label: "From", value: "₹29,999/sq.yd." },
    ],
    drift: { x: 0, y: -20 },
  },
  {
    // f1508–1556 · aerial between the labelled sequences; villas lower-right,
    // open valley upper-left.
    id: "mansanpally",
    in: 1508,
    out: 1556,
    anchor: "top-left",
    scrim: "top",
    focusX: 0.55,
    kicker: "Next",
    title: "Mansanpally.",
    lead: "The southern corridor, near the airport and the proposed Regional Ring Road.",
    link: { href: "/projects/mansanpally", label: "Register interest" },
    drift: { x: 0, y: 18 },
  },
  {
    // f1834–1912 · township at dusk, then the lit clubhouse. Warm lights are
    // centre-right; the left remains in shadow.
    id: "verified",
    in: 1834,
    out: 1912,
    anchor: "left",
    scrim: "left",
    focusX: 0.55,
    kicker: "Nothing hidden",
    title: "Every document,\non the table.",
    lead: "Approvals, link documents and the plot registry — reviewed with you, at your pace.",
    link: { href: "/guides/legal-verification", label: "How to verify a plot" },
    drift: { x: -16, y: 0 },
  },
  {
    // f1920–2000 · the experience-centre doors and lobby, symmetrical and
    // lit centrally. Type sits low-left over polished floor.
    id: "centre",
    in: 1922,
    out: 2000,
    anchor: "bottom-left",
    scrim: "bottom",
    focusX: 0.5,
    kicker: "Shankarpally",
    title: "The doors are\nalready open.",
    lead: "Masterplans, layout models and approval files — daily, 9am to 7pm.",
    drift: { x: 0, y: -24 },
  },
];

/** Interactive markers pinned to the moment each community appears on screen. */
export interface FilmMarker {
  id: string;
  in: number;
  out: number;
  href: string;
  label: string;
  meta: string;
  /** position as viewport percentages — chosen off open ground in the frame */
  x: number;
  y: number;
}

export const MARKERS: FilmMarker[] = [
  {
    id: "raghunath",
    in: 770,
    out: 836,
    href: "/projects/raghunath-county",
    label: "Raghunath County",
    meta: "19 acres · DTCP",
    x: 74,
    y: 62,
  },
  {
    id: "sanctuary-marker",
    in: 1286,
    out: 1360,
    href: "/projects/sanctuary",
    label: "Sanctuary",
    meta: "45 acres · HMDA",
    x: 72,
    y: 30,
  },
];

/** Chapter rail — lets a visitor move through the film without hunting. */
export const CHAPTERS: { id: string; label: string; frame: number }[] = [
  { id: "arrival", label: "Arrival", frame: FILM_IN },
  { id: "corridor", label: "The corridor", frame: 386 },
  { id: "shankarpally", label: "Shankarpally", frame: 484 },
  { id: "raghunath", label: "Raghunath County", frame: 748 },
  { id: "sanctuary", label: "Sanctuary", frame: 1100 },
  { id: "mansanpally", label: "Mansanpally", frame: 1440 },
  { id: "connected", label: "Connected", frame: 1740 },
  { id: "visit", label: "The visit", frame: 1980 },
];

/**
 * Stills used outside the film itself (project pages, closing panels).
 * Every frame here is drawn from a CLEAN window — using a frame that carries
 * the reel's own baked-in typography would put two headlines on one image.
 */
export const PROJECT_STILLS: Record<
  string,
  { hero: number; wide: number; detail: number }
> = {
  // every frame here was pulled and inspected individually — the reel labels
  // itself far more often than a coarse scan suggests
  sanctuary: { hero: 1010, wide: 1300, detail: 1346 },
  "raghunath-county": { hero: 780, wide: 1346, detail: 1290 },
  mansanpally: { hero: 1530, wide: 1232, detail: 1290 },
};

/** original frame → hd-tier still path */
export function stillUrl(frame: number): string {
  return `/film/hd/f${String(Math.round(frame / 2)).padStart(4, "0")}.webp`;
}

/** Envelope for a scene at a given frame: 0 → absent, 1 → fully present. */
export function sceneEnvelope(scene: FilmScene, frame: number): number {
  const span = scene.out - scene.in;
  if (span <= 0) return 0;
  const t = (frame - scene.in) / span;
  if (t <= 0 || t >= 1) return 0;
  const ramp = 0.14;
  if (t < ramp) return t / ramp;
  if (t > 1 - ramp) return (1 - t) / ramp;
  return 1;
}

/** Linear 0–1 progress through a scene, used to drive drift. */
export function sceneProgress(scene: FilmScene, frame: number): number {
  const span = scene.out - scene.in;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (frame - scene.in) / span));
}

/** Focal point in force at a given frame (falls back to centre). */
export function focusAt(frame: number): number {
  let focus = 0.5;
  for (const s of SCENES) {
    if (frame >= s.in - 60 && frame <= s.out + 60 && s.focusX !== undefined) {
      focus = s.focusX;
      break;
    }
  }
  // The presenter stands centre-right in the reception bookends; bias the
  // portrait crop toward her rather than slicing her out of frame.
  if (frame <= 238) focus = 0.58;
  if (frame >= 2008) focus = 0.6;
  return focus;
}
