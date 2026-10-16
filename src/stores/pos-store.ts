import { create } from "zustand";

export type PosMode = "cobrar" | "cargar";

export interface PosLine {
  productId: string;
  quantity: number;
}

/** Most units one line takes: the API's per-line cap for a counter sale and for a delivery. */
export const MAX_LINE_QUANTITY: Record<PosMode, number> = {
  cobrar: 1000,
  cargar: 100000,
};

/**
 * The kiosk's point of sale in progress: the ticket being charged and the delivery being
 * loaded. In memory, outside the screen, so jumping to the Agenda mid-sale and coming back
 * keeps it (a full reload or logging out starts clean). Lines hold product ids only: prices
 * and stock are always read from the current catalog.
 */
interface PosState {
  mode: PosMode;
  lines: Record<PosMode, PosLine[]>;
  /** Supplier or invoice of the delivery being loaded. */
  deliveryNote: string;
  /** The line that just changed, to flash it: `at` makes a repeat scan flash again. */
  touched: { productId: string; at: number } | null;
  setMode: (mode: PosMode) => void;
  /** Adds units of a product (a new line goes on top; a repeated one adds to its line). */
  add: (mode: PosMode, productId: string, quantity?: number) => void;
  setQuantity: (mode: PosMode, productId: string, quantity: number) => void;
  remove: (mode: PosMode, productId: string) => void;
  clear: (mode: PosMode) => void;
  setDeliveryNote: (note: string) => void;
}

const clamp = (mode: PosMode, quantity: number) =>
  Math.min(Math.max(Math.round(quantity), 1), MAX_LINE_QUANTITY[mode]);

export const usePosStore = create<PosState>((set) => ({
  mode: "cobrar",
  lines: { cobrar: [], cargar: [] },
  deliveryNote: "",
  touched: null,
  setMode: (mode) => set({ mode }),
  add: (mode, productId, quantity = 1) =>
    set((state) => {
      const current = state.lines[mode];
      const existing = current.find((l) => l.productId === productId);
      const next = existing
        ? current.map((l) =>
            l.productId === productId
              ? { ...l, quantity: clamp(mode, l.quantity + quantity) }
              : l,
          )
        : [{ productId, quantity: clamp(mode, quantity) }, ...current];
      return {
        lines: { ...state.lines, [mode]: next },
        touched: { productId, at: Date.now() },
      };
    }),
  setQuantity: (mode, productId, quantity) =>
    set((state) => ({
      lines: {
        ...state.lines,
        [mode]: state.lines[mode].map((l) =>
          l.productId === productId ? { ...l, quantity: clamp(mode, quantity) } : l,
        ),
      },
    })),
  remove: (mode, productId) =>
    set((state) => ({
      lines: {
        ...state.lines,
        [mode]: state.lines[mode].filter((l) => l.productId !== productId),
      },
    })),
  clear: (mode) =>
    set((state) => ({
      lines: { ...state.lines, [mode]: [] },
      ...(mode === "cargar" ? { deliveryNote: "" } : {}),
    })),
  setDeliveryNote: (deliveryNote) => set({ deliveryNote }),
}));
