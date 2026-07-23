"use client";

import { Bot } from "lucide-react";

/**
 * "GTP está escribiendo…" bubble. Shown while we're in AI mode and the player's message
 * is the latest one — i.e. the bot is about to answer. (WhatsApp doesn't expose the player's
 * own typing state, so we only show it for the bot, which we can infer.)
 */
export function TypingIndicator({ label = "GTP está escribiendo" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="bg-muted mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
        <Bot className="size-3.5" />
      </span>
      <div className="bg-brand/10 border-brand/20 flex items-center gap-1.5 rounded-xl border px-3 py-2.5">
        <span className="sr-only">{label}…</span>
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}
