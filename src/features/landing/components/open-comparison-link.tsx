"use client";

import type { ReactNode } from "react";

/**
 * Link from a pricing card to the folded plan comparison (`<details id={targetId}>`): it
 * unfolds the table before scrolling to it, which a plain `#hash` link doesn't do in every
 * browser. Without JavaScript it degrades to that plain anchor.
 */
export function OpenComparisonLink({
  targetId,
  className,
  children,
}: {
  targetId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={`#${targetId}`}
      className={className}
      onClick={(event) => {
        const details = document.getElementById(targetId);
        if (!(details instanceof HTMLDetailsElement)) return;
        event.preventDefault();
        details.open = true;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        details.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }}
    >
      {children}
    </a>
  );
}
