import { create } from "zustand";
import type { TourId } from "@/features/help/content/tours";

/**
 * The "Mostrame" guide currently running, if any. Only ever started by a tap (from the
 * checklist or the "?" help) — never on its own, never at login.
 */
interface TourState {
  tourId: TourId | null;
  step: number;
  /** Bumped on every start, so a guide run twice in a row never reuses the last run's state. */
  run: number;
  start: (tourId: TourId) => void;
  next: () => void;
  /** Back one step — when what the current step points at went away (a popover closed). */
  back: () => void;
  stop: () => void;
}

export const useTourStore = create<TourState>((set) => ({
  tourId: null,
  step: 0,
  run: 0,
  start: (tourId) => set((state) => ({ tourId, step: 0, run: state.run + 1 })),
  next: () => set((state) => ({ step: state.step + 1 })),
  back: () => set((state) => ({ step: Math.max(0, state.step - 1) })),
  stop: () => set({ tourId: null, step: 0 }),
}));
