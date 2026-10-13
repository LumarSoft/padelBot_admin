import localFont from "next/font/local";

/*
 * Self-hosted (latin subset, covers Spanish) instead of next/font/google:
 * fetching Google Fonts during the Vercel build failed intermittently and
 * broke deploys.
 */

/** Condensed scoreboard face for the landing's headlines (`font-display`). */
const display = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "../fonts/barlow-condensed-700.woff2", weight: "700" },
    { path: "../fonts/barlow-condensed-800.woff2", weight: "800" },
    { path: "../fonts/barlow-condensed-900.woff2", weight: "900" },
  ],
});

/** Handwriting for the "paper notebook" section (`font-hand`). */
const hand = localFont({
  variable: "--font-hand",
  display: "swap",
  src: [{ path: "../fonts/caveat-variable.woff2", weight: "400 700" }],
});

/** Apply on the landing's root element so its children can use both faces. */
export const LANDING_FONT_VARIABLES = `${display.variable} ${hand.variable}`;
