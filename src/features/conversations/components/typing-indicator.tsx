"use client";

import { cn } from "@/lib/utils";
import { BUBBLE_SHADOW, TAIL_OUT } from "./message-bubble";

/**
 * "El bot está escribiendo…": three dots in a bubble on the club's side, shown while we're in
 * AI mode and the player's message is the latest — the bot is about to answer. (WhatsApp
 * doesn't expose the player's own typing state, so this only exists for the bot.)
 */
export function TypingIndicator() {
  return (
    <div className="mt-3 flex justify-end" role="status">
      <div
        className={cn(
          "bg-wa-out relative flex items-center gap-1 rounded-lg px-3.5 py-3",
          BUBBLE_SHADOW,
          TAIL_OUT,
        )}
      >
        <span className="sr-only">El bot está escribiendo…</span>
        <Dot delay="0ms" />
        <Dot delay="160ms" />
        <Dot delay="320ms" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      aria-hidden
      className="bg-wa-meta size-2 animate-bounce rounded-full"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}
