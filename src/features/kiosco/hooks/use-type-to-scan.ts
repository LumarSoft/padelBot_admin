"use client";

import { useEffect, useRef, type RefObject } from "react";

const NON_TEXT_INPUTS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/** Text fields keep their own keys: a quantity, a note, the dialog's search. */
function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  return target instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(target.type);
}

/** Something on top owns the keyboard: a dialog, an open select or menu. */
function isInsideOverlay(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('[role="dialog"], [role="alertdialog"], [role="listbox"], [role="menu"]') !== null
  );
}

/**
 * Keeps the barcode scanner working wherever the focus is. A scanner is a keyboard: a scan made
 * while a button (or nothing) has the focus would type into the void — and its final Enter
 * would press that button, e.g. «Cobrar». So any printable key typed outside a text field
 * moves the focus to the scanner box and lands there; the rest of the code and the Enter
 * follow it on their own. The box is uncontrolled for this reason: the next keys arrive before
 * React re-renders, and they must append to what's already in it.
 */
export function useTypeToScan(
  inputRef: RefObject<HTMLInputElement | null>,
  enabled: boolean,
  onText: (value: string) => void,
) {
  // Read through a ref so the listener isn't re-attached on every render.
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      // Space stays a button press; codes never start with one.
      if (event.key.length !== 1 || event.key === " ") return;
      if (isTextField(event.target) || isInsideOverlay(event.target)) return;
      const input = inputRef.current;
      if (!input || input.disabled) return;
      event.preventDefault();
      input.focus();
      input.value += event.key;
      onTextRef.current(input.value);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, inputRef]);
}
