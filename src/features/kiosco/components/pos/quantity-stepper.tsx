"use client";

import { useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { looksLikeBarcode } from "@/features/kiosco/lib/pos";

/**
 * − / number / +. The number is a real field so "llegaron 24" is typed, not tapped 24 times;
 * it commits on Enter or when leaving it, then hands the keyboard back to the scanner. A scan
 * that lands in it by mistake (8+ characters on Enter: no quantity is that long) is passed on
 * to the scanner instead of becoming the quantity.
 */
export function QuantityStepper({
  value,
  max,
  label,
  onChange,
  onScan,
  onDone,
}: {
  value: number;
  max: number;
  /** What is being counted, for screen readers ("Agua 500 ml"). */
  label: string;
  onChange: (quantity: number) => void;
  onScan: (code: string) => void;
  /** Called after any change: the point of sale puts the focus back on the scanner. */
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  // Handing the focus back blurs the field before React re-renders, so the blur would commit
  // the stale draft: after Escape or a misplaced scan, that commit is skipped.
  const discard = useRef(false);

  function commit() {
    if (draft === null || discard.current) {
      discard.current = false;
      return;
    }
    const n = Number(draft);
    if (Number.isInteger(n) && n >= 1) onChange(Math.min(n, max));
    setDraft(null);
  }

  function cancel() {
    discard.current = true;
    setDraft(null);
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`Uno menos de ${label}`}
        disabled={value <= 1}
        onClick={() => {
          onChange(value - 1);
          onDone();
        }}
      >
        <Minus />
      </Button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Cantidad de ${label}`}
        data-pos-quantity
        value={draft ?? String(value)}
        onFocus={(e) => {
          discard.current = false;
          setDraft(String(value));
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            cancel();
            onDone();
          }
          if (e.key !== "Enter") return;
          e.preventDefault();
          const typed = e.currentTarget.value;
          if (typed.length >= 8 && looksLikeBarcode(typed)) {
            cancel();
            onScan(typed);
          } else {
            commit();
            discard.current = true;
          }
          onDone();
        }}
        className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/50 h-7 w-12 rounded-md border text-center text-sm font-semibold tabular-nums outline-none focus-visible:ring-3"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`Uno más de ${label}`}
        disabled={value >= max}
        onClick={() => {
          onChange(value + 1);
          onDone();
        }}
      >
        <Plus />
      </Button>
    </div>
  );
}
