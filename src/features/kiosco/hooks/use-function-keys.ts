"use client";

import { useEffect, useRef } from "react";
import { isInsideOverlay } from "@/features/kiosco/hooks/use-type-to-scan";

/**
 * The point of sale's shortcuts. Function keys only: a scanner types printable characters and
 * Enter, so no code can ever press one, and they work with the focus anywhere on the screen
 * (the scanner box, «Paga con», a quantity). F5–F7 and F10–F12 are left alone: the browser
 * reloads, moves the focus or opens its tools with them.
 */
export const POS_KEYS = {
  cash: "F1",
  qr: "F2",
  transfer: "F3",
  confirm: "F4",
  modeCobrar: "F8",
  modeCargar: "F9",
} as const;

export type PosKey = (typeof POS_KEYS)[keyof typeof POS_KEYS];

/** A quantity half typed is committed (its field commits on blur) before a shortcut acts on it. */
function commitTypedQuantity() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.matches("[data-pos-quantity]")) active.blur();
}

/**
 * Runs the handler of each function key pressed while `enabled`. Ignored inside a dialog or an
 * open menu (it owns the keyboard), with a modifier held, and on a held key's repeats.
 */
export function useFunctionKeys(
  enabled: boolean,
  handlers: Partial<Record<PosKey, () => void>>,
) {
  // Read through a ref so the listener isn't re-attached on every render.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }
      const handler = handlersRef.current[event.key as PosKey];
      if (!handler || isInsideOverlay(event.target)) return;
      // Also on repeats: F1 held down must not open the browser's help.
      event.preventDefault();
      if (event.repeat) return;
      commitTypedQuantity();
      handler();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
