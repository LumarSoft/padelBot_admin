import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export interface FeedEntry {
  title: string;
  body: string;
  /** Minutes the clock moves forward when this notification arrives. */
  gap: number;
  /** Highlights the one that needs the owner, not the bot. */
  needsOwner?: boolean;
}

export interface FeedNotification extends FeedEntry {
  id: number;
  /** Minute of the day it arrived at. */
  at: number;
}

interface FeedState {
  /** Current minute of the day shown on the clock. */
  now: number;
  /** Newest first. */
  items: FeedNotification[];
}

const ARRIVAL_MS = 3800;

/**
 * A lock screen filling up overnight: every few seconds the next scripted
 * notification lands on top and the clock moves forward. The script loops.
 * With reduced motion it stays on the initial screen.
 */
export function useNotificationFeed(
  script: FeedEntry[],
  startMinute: number,
  visible: number,
): FeedState {
  const reducedMotion = usePrefersReducedMotion();
  const [state, setState] = useState<FeedState>(() =>
    seedFeed(script, startMinute, visible),
  );

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setState((prev) => {
        const nextId = prev.items[0].id + 1;
        const entry = script[nextId % script.length];
        const now = prev.now + entry.gap;
        return {
          now,
          items: [{ ...entry, id: nextId, at: now }, ...prev.items].slice(0, visible),
        };
      });
    }, ARRIVAL_MS);
    return () => window.clearInterval(timer);
  }, [script, visible, reducedMotion]);

  return state;
}

/** The screen as it looks when the page loads: the first `visible` entries already in. */
function seedFeed(script: FeedEntry[], startMinute: number, visible: number): FeedState {
  let at = startMinute;
  const items: FeedNotification[] = [];
  for (let id = 0; id < visible; id += 1) {
    if (id > 0) at += script[id].gap;
    items.unshift({ ...script[id], id, at });
  }
  return { now: at, items };
}
