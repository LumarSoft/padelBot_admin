"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Pointer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { getTour } from "@/features/help/content/tours";
import { useTourStore } from "@/features/help/stores/tour-store";

/** How long a step waits for its element (navigation, data loading, a popover opening). */
const FIND_TIMEOUT_MS = 6000;
/**
 * Right after a navigation the screen is still filling in (data, animations): for this long a
 * step keeps looking for a better-placed element before scrolling to the one it has.
 */
const SETTLE_MS = 700;
/** A step whose element vanishes for this long falls back to the previous one. */
const LOST_GRACE_MS = 500;
/** Breathing room between the element and the highlight ring. */
const PAD = 6;
const GAP = 10;
const EDGE = 12;
/** Room the bubble needs above or below the element (it is never taller). */
const BUBBLE_ROOM = 130;

/**
 * Whether the person can actually see the element: inside the window AND not clipped by a
 * scrolling container (the Agenda grid scrolls sideways, so a cell can be "on screen" by its
 * coordinates and still hidden). The dim layer ignores the pointer, so the hit test sees
 * through it.
 */
function isShown(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect();
  // Probe the middle of the part that's inside the window (a long list only shows its top).
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, window.innerWidth);
  if (bottom - top < 8 || right - left < 8) return false;
  const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
  return !!hit && node.contains(hit);
}

/**
 * The element carrying the anchor that the person can see best: one on screen and not clipped,
 * else the first with a size (it gets scrolled into view). Several share an anchor on purpose (every
 * free cell of the Agenda is `agenda-libre`), and one element can carry several,
 * space-separated (`data-help="agenda-por-cobrar agenda-reservado"`).
 */
function findTarget(anchor: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-help~="${anchor}"]`);
  let fallback: HTMLElement | null = null;
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (isShown(node)) return node;
    fallback ??= node;
  }
  return fallback;
}

function sameRect(a: DOMRect | null, b: DOMRect): boolean {
  return (
    !!a &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/** The smallest box holding both (the highlighted element and the button the step waits for). */
function union(a: DOMRect, b: DOMRect | null): DOMRect {
  if (!b) return a;
  const left = Math.min(a.left, b.left);
  const top = Math.min(a.top, b.top);
  return new DOMRect(left, top, Math.max(a.right, b.right) - left, Math.max(a.bottom, b.bottom) - top);
}

function bubblePosition(rect: DOMRect): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(320, vw - EDGE * 2);
  const centered = rect.left + rect.width / 2 - width / 2;
  const left = Math.min(Math.max(centered, EDGE), vw - width - EDGE);
  if (vh - rect.bottom >= BUBBLE_ROOM) return { top: rect.bottom + PAD + GAP, left, width };
  if (rect.top >= BUBBLE_ROOM) return { bottom: vh - rect.top + PAD + GAP, left, width };
  // An element taller than the screen (the whole grid): the bubble sits at the bottom of it.
  return { bottom: EDGE + 4, left, width };
}

/**
 * "Mostrame": runs the guide started from the checklist or the "?" help. It takes the person to
 * the guide's screen, rings the real element (`data-help` anchor) under a dimmed page and shows
 * a one-line bubble. The dim never blocks clicks — the person does the real thing on the real
 * screen, and a step with `waitFor` moves on when they tap it.
 *
 * Built in-house instead of driver.js & co.: those libraries expect the element to exist when
 * the step starts, while here it shows up after a navigation, a fetch or a popover opening; and
 * their overlay swallows the "outside" click that closes a Base UI popover.
 */
export function TourOverlay() {
  const tourId = useTourStore((state) => state.tourId);
  const step = useTourStore((state) => state.step);
  const run = useTourStore((state) => state.run);
  const next = useTourStore((state) => state.next);
  const back = useTourStore((state) => state.back);
  const stop = useTourStore((state) => state.stop);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const tour = tourId ? getTour(tourId) : null;
  const current = tour?.steps[step] ?? null;
  const isLast = tour ? step === tour.steps.length - 1 : false;
  const canGoBack = step > 0 && !!tour?.steps[step - 1]?.waitFor;
  const onRoute = !tour?.route || pathname === tour.route;

  // What the current step found, tagged with the step it belongs to: a new step starts blank
  // without an effect having to reset anything.
  const stepKey = `${run}:${step}`;
  const [found, setFound] = useState<{
    key: string;
    rect: DOMRect | null;
    /** Where the bubble must not go: the element plus the button the step waits for. */
    avoid: DOMRect | null;
    missing: boolean;
  }>({ key: "", rect: null, avoid: null, missing: false });
  const rect = found.key === stepKey ? found.rect : null;
  const avoid = found.key === stepKey ? found.avoid : null;
  const missing = found.key === stepKey && found.missing;
  const arrivedRef = useRef(false);

  const finish = useCallback(() => {
    stop();
    // Doing the real thing during the guide is what ticks the checklist — show it right away.
    void queryClient.invalidateQueries({ queryKey: queryKeys.help.firstDay });
  }, [queryClient, stop]);

  // Go to the guide's screen; leaving it halfway ends the guide.
  useEffect(() => {
    arrivedRef.current = false;
  }, [tourId]);
  useEffect(() => {
    if (!tour?.route) return;
    if (pathname === tour.route) {
      arrivedRef.current = true;
    } else if (arrivedRef.current) {
      finish();
    } else {
      router.push(tour.route);
    }
  }, [tour, pathname, router, finish]);

  // Find the step's element and follow it (scroll, popovers animating, dialogs resizing).
  useEffect(() => {
    if (!current || !onRoute) return;

    let element: HTMLElement | null = null;
    const settleUntil = performance.now() + SETTLE_MS;
    let deadline = performance.now() + FIND_TIMEOUT_MS;
    let seen = false;
    let lostSince: number | null = null;
    let frame = 0;

    const track = () => {
      const now = performance.now();
      const settling = !seen && now < settleUntil;
      if (!element?.isConnected || (settling && !isShown(element))) {
        element = findTarget(current.target);
      }

      if (element) {
        if (!seen && !settling) {
          seen = true;
          if (!isShown(element)) {
            const tall = element.getBoundingClientRect().height > window.innerHeight * 0.7;
            element.scrollIntoView({ block: tall ? "start" : "center", inline: "center", behavior: "smooth" });
          }
        }
        lostSince = null;
        deadline = now + FIND_TIMEOUT_MS;
        const box = element.getBoundingClientRect();
        // The button that ends the step may sit outside the highlight (a dialog's footer).
        const waitBox =
          current.waitFor && current.waitFor !== current.target
            ? (findTarget(current.waitFor)?.getBoundingClientRect() ?? null)
            : null;
        const keep = union(box, waitBox);
        setFound((prev) =>
          prev.key === stepKey && !prev.missing && sameRect(prev.rect, box) && sameRect(prev.avoid, keep)
            ? prev
            : { key: stepKey, rect: box, avoid: keep, missing: false },
        );
      } else if (seen && canGoBack) {
        // What this step pointed at went away (the person closed the popover): go back to
        // the step that opens it instead of pointing at nothing.
        lostSince ??= now;
        if (now - lostSince > LOST_GRACE_MS) {
          back();
          return;
        }
      } else if (now > deadline) {
        setFound({ key: stepKey, rect: null, avoid: null, missing: true });
        return;
      }
      frame = requestAnimationFrame(track);
    };

    frame = requestAnimationFrame(track);
    return () => cancelAnimationFrame(frame);
  }, [current, onRoute, canGoBack, back, stepKey]);

  // A step with `waitFor` moves on when the person taps the real element. Capture phase, so
  // it hears the tap even if the app stops it, without ever interfering with it.
  useEffect(() => {
    const anchor = current?.waitFor;
    if (!anchor) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(`[data-help~="${anchor}"]`)) return;
      if (isLast) finish();
      else next();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [current, isLast, next, finish]);

  useEffect(() => {
    if (!tour) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tour, finish]);

  if (!tour || !current || typeof document === "undefined") return null;
  if (!rect && !missing) return null;

  const total = tour.steps.length;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]" data-tour-overlay>
      {rect && (
        <div
          aria-hidden
          className="ring-brand ease-fluid absolute rounded-xl ring-2 shadow-[0_0_0_9999px_rgb(0_0_0/0.45),0_0_24px_4px_color-mix(in_oklch,var(--brand),transparent_55%)] transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      <div
        key={`${stepKey}-${missing}`}
        role="dialog"
        aria-live="polite"
        aria-label="Guía en pantalla"
        className="glass-overlay ring-brand/30 animate-scale-in pointer-events-auto absolute rounded-xl p-3 text-sm shadow-lg ring-1"
        style={
          rect
            ? bubblePosition(avoid ?? rect)
            : {
                bottom: 24,
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(320px, calc(100vw - 24px))",
              }
        }
      >
        <div className="flex items-start gap-2">
          <p className="flex-1 font-medium text-pretty">
            {missing ? (current.missing ?? "No lo encuentro en esta pantalla.") : current.text}
          </p>
          <button
            type="button"
            onClick={finish}
            aria-label="Cerrar la guía"
            className="text-muted-foreground hover:text-foreground -m-1 rounded p-1 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="mt-2.5 flex min-h-7 items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs tabular-nums">
            {total > 1 && !missing ? `${step + 1} de ${total}` : ""}
          </span>
          {missing ? (
            <Button size="sm" variant="outline" onClick={finish}>
              Entendido
            </Button>
          ) : current.waitFor ? (
            <span className="text-brand flex items-center gap-1 text-xs font-medium">
              <Pointer className="size-3.5" />
              Tocá donde está marcado
            </span>
          ) : (
            <Button size="sm" variant="brand" onClick={isLast ? finish : next}>
              {isLast ? "Listo" : "Siguiente"}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
