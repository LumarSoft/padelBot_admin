import { create } from "zustand";

const STORAGE_KEY = "gtp:payment-sound";

/**
 * Whether the payment-alert sound is muted. Persisted to localStorage so the preference
 * survives reloads. Data only — playback lives in `play-cash-sound.ts`.
 */
interface SoundState {
  muted: boolean;
  toggleMuted: () => void;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  muted: typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "off",
  toggleMuted: () => {
    const muted = !get().muted;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, muted ? "off" : "on");
    }
    set({ muted });
  },
}));
