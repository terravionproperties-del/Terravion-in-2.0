import { Noto_Serif_Devanagari, Anek_Devanagari } from "next/font/google";

/**
 * Hindi typography.
 *
 * Noto Serif Devanagari for display, Anek Devanagari for body — the same
 * serif/sans logic as Telugu, so the three languages read as one design system
 * rather than three sites that happen to share a logo.
 *
 * Tiro Devanagari Hindi is the more characterful editorial serif and was the
 * first choice, but it ships a single 400 weight. The display scale here runs to
 * 700, and synthetic bold on Devanagari thickens the shirorekha unevenly against
 * the matras hanging off it, which reads as broken rather than bold. A variable
 * family that can actually reach 700 is worth more than the extra character.
 *
 * `latin` is included for the same reason as Telugu: numerals and the wordmark
 * stay Latin inside Hindi sentences.
 */
const displaySerif = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-display-serif",
  display: "swap",
  preload: true,
});

const bodySans = Anek_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-body-sans",
  display: "swap",
  preload: true,
});

export const fontVariables = `${displaySerif.variable} ${bodySans.variable}`;
