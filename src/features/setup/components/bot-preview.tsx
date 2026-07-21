"use client";

import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A live WhatsApp preview of the bot, rendered from the config the owner is typing right
 * now. It's the point of the wizard: every field they fill has a visible consequence in
 * the conversation their players will actually have, so nothing is configured blind.
 */

export interface PreviewBubble {
  from: "bot" | "player";
  text: string;
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PB"
  );
}

/**
 * The bot sends WhatsApp markup, where *asterisks* mean bold. Render it the way the player
 * will actually see it — showing the raw asterisks would make the preview a lie.
 */
function renderWhatsAppMarkup(text: string) {
  return text.split(/(\*[^*\n]+\*)/g).map((chunk, i) =>
    chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 2 ? (
      <strong key={i} className="font-semibold">
        {chunk.slice(1, -1)}
      </strong>
    ) : (
      chunk
    ),
  );
}

function Bubble({ bubble, index }: { bubble: PreviewBubble; index: number }) {
  const isBot = bubble.from === "bot";
  return (
    <div
      className={cn("animate-fade-up flex", isBot ? "justify-start" : "justify-end")}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3 py-2 text-[13px] leading-snug whitespace-pre-line shadow-sm",
          isBot
            ? "bg-card text-card-foreground rounded-bl-sm"
            : "rounded-br-sm bg-emerald-600 text-white",
        )}
      >
        <p className="text-pretty">{renderWhatsAppMarkup(bubble.text)}</p>
        {!isBot && (
          <span className="mt-0.5 flex items-center justify-end text-white/70">
            <CheckCheck className="size-3" />
          </span>
        )}
      </div>
    </div>
  );
}

export function BotPreview({
  clubName,
  bubbles,
  caption,
  className,
}: {
  clubName: string;
  bubbles: PreviewBubble[];
  /** One line under the phone explaining what the owner is looking at. */
  caption: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="border-border/70 bg-background shadow-brand/10 rounded-[1.75rem] border p-2 shadow-2xl">
        <div className="border-border/60 overflow-hidden rounded-[1.35rem] border">
          <div className="flex items-center gap-2.5 bg-emerald-700 px-3 py-2.5 text-white">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">
              {initials(clubName)}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold">{clubName}</p>
              <p className="flex items-center gap-1 text-[10px] text-emerald-100">
                <span className="size-1.5 rounded-full bg-emerald-300" />
                en línea
              </p>
            </div>
          </div>

          <div className="bg-muted/40 flex min-h-64 flex-col gap-2 px-2.5 py-3">
            {bubbles.map((bubble, i) => (
              // Keyed on content so a config change replays the entrance animation —
              // the owner SEES the message change as they type.
              <Bubble key={`${i}-${bubble.text}`} bubble={bubble} index={i} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-muted-foreground px-1 text-center text-xs text-balance">
        {caption}
      </p>
    </div>
  );
}
