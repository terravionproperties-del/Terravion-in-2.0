import { Cormorant_Garamond, Inter } from "next/font/google";

/**
 * English typography.
 *
 * Cormorant Garamond carries the display voice. It is an old-style face with
 * high stroke contrast and wide, open letterforms — it reads as quiet luxury
 * at headline size rather than as fashion-magazine display, which is the right
 * register for land that is bought slowly and deliberately.
 *
 * It replaced Fraunces, whose `SOFT` and `WONK` axes gave headlines a
 * deliberate quirk — slabby, slightly wobbling serifs — that read as playful.
 *
 * Weights are explicit because Cormorant Garamond is not a variable font here:
 * 300 for the largest headlines, 400 for ordinary display, 500/600 where a
 * heading sits against dense text. Asking for a weight the family does not
 * ship makes the browser synthesise one, and synthetic weight on a
 * high-contrast serif thickens the stems and destroys exactly the thin strokes
 * that make it look expensive.
 *
 * Inter carries body text, unchanged.
 */
const displaySerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display-serif",
  display: "swap",
  preload: true,
});

const bodySans = Inter({
  subsets: ["latin"],
  variable: "--font-body-sans",
  display: "swap",
  preload: true,
});

export const fontVariables = `${displaySerif.variable} ${bodySans.variable}`;
