"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface AnimatedNumberProps {
  value: number;
  /** Formats each frame (e.g. formatPrice, percentages). Defaults to rounded integer. */
  format?: (value: number) => string;
  className?: string;
}

/**
 * Counts up to `value` on mount and tweens between values on change.
 * SSR renders the final value, so there is no flash without JS.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const state = useRef({ current: 0 });

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const fmt = format ?? ((n: number) => Math.round(n).toString());

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        state.current.current = value;
        el.textContent = fmt(value);
        return;
      }

      gsap.to(state.current, {
        current: value,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = fmt(state.current.current);
        },
      });
    },
    { dependencies: [value] },
  );

  return (
    <span ref={ref} className={className}>
      {format ? format(value) : value}
    </span>
  );
}
