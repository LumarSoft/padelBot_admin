"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scroll-triggered reveal wrapper for the landing. Animates every descendant
 * marked with `.reveal` into view with a fade-up + stagger as it enters the
 * viewport.
 *
 * The hidden state is applied via GSAP (not CSS), so with JavaScript disabled
 * the content stays fully visible. `prefers-reduced-motion` is respected.
 */
export function Reveal({
  children,
  className,
  y = 24,
  stagger = 0.09,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  stagger?: number;
}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>(".reveal", scope.current);
      if (!targets.length) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(targets, { opacity: 0, y });
        ScrollTrigger.batch(targets, {
          start: "top 85%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              stagger,
              overwrite: true,
            }),
        });
      });
    },
    { scope },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
