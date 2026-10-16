"use client";

import { useEffect } from "react";
import { rememberUtm, utmFrom } from "@/features/signup/lib/utm";

/**
 * Keeps the campaign of the link that brought the visitor (its UTM parameters) for this tab, so
 * the signup they reach through any of the landing's buttons can send it with their answers.
 * Renders nothing.
 */
export function UtmCapture() {
  useEffect(() => {
    const utm = utmFrom(new URLSearchParams(window.location.search));
    if (utm) rememberUtm(utm);
  }, []);
  return null;
}
