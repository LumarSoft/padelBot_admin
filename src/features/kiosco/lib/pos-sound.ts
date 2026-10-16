"use client";

import { useSyncExternalStore } from "react";

/**
 * What the counter hears. The scanner's own beep only says it read a code; these say what the
 * panel did with it, so whoever is scanning can keep their eyes on the product:
 *   - "added":   one short high bip — it's on the ticket (or the bill).
 *   - "unknown": two flat beeps — look at the screen, the code isn't loaded.
 *   - "error":   one low buzz — nothing was added.
 *   - "done":    a rising pair — charged, loaded into stock, or a payment registered.
 *   - "undo":    a falling pair — the sale was cancelled.
 * Synthesized with Web Audio (no files to load). A scan is a keypress, which counts as a user
 * gesture, so the browser lets it play.
 */
export type PosCue = "added" | "unknown" | "error" | "done" | "undo";

interface Note {
  /** Hz. */
  freq: number;
  /** Seconds after the cue starts. */
  at: number;
  /** Seconds. */
  length: number;
}

const CUES: Record<PosCue, { wave: OscillatorType; volume: number; notes: Note[] }> = {
  added: { wave: "sine", volume: 0.16, notes: [{ freq: 1568, at: 0, length: 0.08 }] },
  unknown: {
    wave: "triangle",
    volume: 0.2,
    notes: [
      { freq: 523, at: 0, length: 0.11 },
      { freq: 523, at: 0.16, length: 0.11 },
    ],
  },
  error: { wave: "square", volume: 0.06, notes: [{ freq: 196, at: 0, length: 0.22 }] },
  done: {
    wave: "sine",
    volume: 0.16,
    notes: [
      { freq: 1047, at: 0, length: 0.1 },
      { freq: 1568, at: 0.1, length: 0.2 },
    ],
  },
  undo: {
    wave: "sine",
    volume: 0.14,
    notes: [
      { freq: 784, at: 0, length: 0.1 },
      { freq: 523, at: 0.1, length: 0.18 },
    ],
  },
};

const STORAGE_KEY = "gtp:pos-sound";

let context: AudioContext | null = null;
let muted: boolean | null = null;
const listeners = new Set<() => void>();

/** Per computer: the counter's PC may want it on and the owner's laptop off. */
function readMuted(): boolean {
  if (muted === null) {
    try {
      muted = window.localStorage.getItem(STORAGE_KEY) === "off";
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function setPosSoundOn(on: boolean) {
  muted = !on;
  try {
    if (on) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, "off");
  } catch {
    // Private mode or blocked storage: the choice lasts until the page reloads.
  }
  listeners.forEach((listener) => listener());
  if (on) playPosCue("added");
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether the counter's sounds are on (on by default; off is remembered on this computer). */
export function usePosSoundOn(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !readMuted(),
    () => true,
  );
}

export function playPosCue(cue: PosCue) {
  if (typeof window === "undefined" || readMuted()) return;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const { wave, volume, notes } = CUES[cue];
    const start = context.currentTime + 0.01;
    for (const note of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = wave;
      oscillator.frequency.value = note.freq;
      const from = start + note.at;
      const to = from + note.length;
      // A short attack and an exponential tail: no click at either end.
      gain.gain.setValueAtTime(0.0001, from);
      gain.gain.exponentialRampToValueAtTime(volume, from + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, to);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(from);
      oscillator.stop(to + 0.02);
    }
  } catch {
    // No audio on this device: the screen still says it all.
  }
}
