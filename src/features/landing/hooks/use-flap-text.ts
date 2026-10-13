import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const FLAP_CHARSET = "ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789";
const TICK_MS = 55;
/** Ticks a changed character spins before it settles, plus a per-column delay. */
const BASE_SPINS = 4;

function randomFlapChar(): string {
  return FLAP_CHARSET[Math.floor(Math.random() * FLAP_CHARSET.length)];
}

/**
 * Split-flap text: when `target` changes, every character that differs spins
 * through random glyphs and settles left-to-right, like an airport board.
 * Both strings must already be padded to the same length.
 */
export function useFlapText(target: string): string {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return;
    if (reducedMotion) {
      shownRef.current = target;
      return;
    }

    const commit = (next: string) => {
      shownRef.current = next;
      setShown(next);
    };

    const settleAt = [...target].map(
      (char, i) => (char === from[i] ? 0 : BASE_SPINS + i + Math.floor(Math.random() * 3)),
    );
    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      const next = [...target]
        .map((char, i) => (tick >= settleAt[i] || char === " " ? char : randomFlapChar()))
        .join("");
      commit(next);
      if (next === target) window.clearInterval(timer);
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [target, reducedMotion]);

  return reducedMotion ? target : shown;
}
