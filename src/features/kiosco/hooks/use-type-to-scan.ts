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
export function isInsideOverlay(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('[role="dialog"], [role="alertdialog"], [role="listbox"], [role="menu"]') !== null
  );
}

/** The key was typed in the dialog the scanner box lives in (not in one opened on top of it). */
function isInOwnDialog(target: EventTarget | null, input: HTMLInputElement): boolean {
  const dialog = input.closest('[role="dialog"]');
  return dialog !== null && target instanceof Node && dialog.contains(target);
}

/**
 * Keeps the barcode scanner working wherever the focus is. A scanner is a keyboard: a scan made
 * while a button (or nothing) has the focus would type into the void — and its final Enter
 * would press that button, e.g. «Cobrar». So any printable key typed outside a text field
 * moves the focus to the scanner box and lands there; the rest of the code and the Enter
 * follow it on their own. The box is uncontrolled for this reason: the next keys arrive before
 * React re-renders, and they must append to what's already in it.
 *
 * `scope: "dialog"` is for a box inside a dialog (the cuenta del turno), which the page-wide
 * rule leaves alone: there only the keys typed in the box's own dialog count, and they stop
 * here — a focused select would otherwise pick a product by the code's first digit.
 */
export function useTypeToScan(
  inputRef: RefObject<HTMLInputElement | null>,
  enabled: boolean,
  onText: (value: string) => void,
  scope: "page" | "dialog" = "page",
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
      if (isTextField(event.target)) return;
      const input = inputRef.current;
      if (!input || input.disabled) return;
      if (scope === "page" ? isInsideOverlay(event.target) : !isInOwnDialog(event.target, input)) {
        return;
      }
      event.preventDefault();
      if (scope === "dialog") event.stopPropagation();
      input.focus();
      input.value += event.key;
      onTextRef.current(input.value);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, inputRef, scope]);
}
