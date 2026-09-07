import { Noto_Serif_Telugu, Anek_Telugu } from "next/font/google";

/**
 * Telugu typography.
 *
 * Noto Serif Telugu carries the display voice. It is the only Telugu serif with
 * a genuine variable weight axis across 100-900, which matters here because the
 * design calls for 300 through 700 — a single-weight face such as Suranna or
 * Ramabhadra would leave the browser synthesising bold, and synthetic bold on a
 * script with this much curve detail smears the glyphs at headline size.
 *
 * Anek Telugu carries body text. Variable, contemporary, and drawn as a Telugu
 * family rather than adapted from a Latin skeleton, so the vowel signs sit where
 * a Telugu reader expects them.
 *
 * Both include the `latin` subset deliberately. Prices, plot dimensions and the
 * Terravion wordmark stay in Latin inside Telugu sentences, and pulling those
 * glyphs from the same family keeps the mixed line optically even instead of
 * dropping to a system fallback mid-sentence.
 */
const displaySerif = Noto_Serif_Telugu({
  subsets: ["telugu", "latin"],
  variable: "--font-display-serif",
  display: "swap",
  preload: true,
});

const bodySans = Anek_Telugu({
  subsets: ["telugu", "latin"],
  variable: "--font-body-sans",
  display: "swap",
  preload: true,
});

export const fontVariables = `${displaySerif.variable} ${bodySans.variable}`;
