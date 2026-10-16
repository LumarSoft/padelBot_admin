import { cn } from "@/lib/utils";
import type { PosCue } from "@/features/kiosco/lib/pos-sound";

export type PulseTone = "ok" | "warn" | "bad";

export interface Pulse {
  tone: PulseTone;
  /** New on every pulse, so the same tone twice in a row replays. */
  id: number;
}

/** The sound and the pulse say the same thing: added, unknown (look at the screen), nothing. */
export function pulseToneFor(cue: PosCue): PulseTone {
  return cue === "added" || cue === "done" ? "ok" : cue === "unknown" ? "warn" : "bad";
}

const TINT: Record<Exclude<PulseTone, "ok">, string> = {
  warn: "[--flash:var(--color-amber-500)]",
  bad: "[--flash:var(--color-red-500)]",
};

/**
 * The scanner box's answer to each Enter: a tint that fades out — the screen's accent when it
 * added something, amber for a code that isn't loaded, red when nothing was added. Put it inside
 * the (relative) box: re-keyed per pulse, it replays without touching the input's focus or text.
 */
export function ScanPulse({ pulse, okTint }: { pulse: Pulse | null; okTint: string }) {
  if (!pulse) return null;
  return (
    <span
      key={pulse.id}
      aria-hidden
      className={cn(
        "animate-pos-flash pointer-events-none absolute inset-0 rounded-[inherit]",
        pulse.tone === "ok" ? okTint : TINT[pulse.tone],
      )}
    />
  );
}

const SHAKE: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-5px)" },
  { transform: "translateX(5px)" },
  { transform: "translateX(-3px)" },
  { transform: "translateX(2px)" },
  { transform: "translateX(0)" },
];

/** A short "no" for the scanner box. Imperative, so the box (and its input) isn't remounted. */
export function shake(element: HTMLElement | null) {
  if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  element.animate(SHAKE, { duration: 320, easing: "ease-in-out" });
}
