import { Barlow_Condensed, Caveat } from "next/font/google";

/** Condensed scoreboard face for the landing's headlines (`font-display`). */
const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

/** Handwriting for the "paper notebook" section (`font-hand`). */
const hand = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["500", "700"],
});

/** Apply on the landing's root element so its children can use both faces. */
export const LANDING_FONT_VARIABLES = `${display.variable} ${hand.variable}`;
