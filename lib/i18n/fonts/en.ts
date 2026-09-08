import { Montserrat } from "next/font/google";

/**
 * Modern luxury real estate typography using Montserrat across all weights.
 */
const montserratDisplay = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-display-serif",
  display: "swap",
  preload: true,
});

const montserratBody = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-body-sans",
  display: "swap",
  preload: true,
});

export const fontVariables = `${montserratDisplay.variable} ${montserratBody.variable}`;
