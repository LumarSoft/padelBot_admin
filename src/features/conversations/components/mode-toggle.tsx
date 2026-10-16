"use client";

import { Bot, UserCog, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationMode } from "@/types/api/conversations";

interface Props {
  mode: ConversationMode;
  onChange: (mode: ConversationMode) => void;
  isPending?: boolean;
}

/**
 * Segmented IA ⟷ Humano switch. Unlike a single button, it always shows both states so an
 * admin can tell at a glance who is driving the conversation — and the active half is filled
 * (WhatsApp green for the bot, amber for a person). On a phone only the icons show.
 */
export function ModeToggle({ mode, onChange, isPending }: Props) {
  const isHuman = mode === "HUMAN";

  return (
    <div
      role="radiogroup"
      aria-label="Quién responde la conversación"
      data-help="chat-modo"
      className="relative grid w-[5.5rem] shrink-0 grid-cols-2 rounded-full bg-black/[0.06] p-0.5 text-xs font-medium sm:w-40 dark:bg-white/10"
    >
      {/* Sliding highlight — half the track, slides to the active side */}
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full shadow-sm transition-all duration-300 ease-fluid",
          isHuman ? "left-1/2 bg-amber-500" : "bg-wa-green left-0.5",
        )}
      />
      <button
        type="button"
        role="radio"
        aria-checked={!isHuman}
        aria-label="IA: responde el bot"
        disabled={isPending || !isHuman}
        onClick={() => onChange("AI")}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full py-1.5 transition-colors disabled:cursor-default",
          !isHuman ? "text-white" : "text-wa-muted hover:text-wa-text",
        )}
      >
        {isPending && !isHuman ? <Loader2 className="size-3.5 animate-spin" /> : <Bot className="size-3.5" />}
        <span className="hidden sm:inline">IA</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={isHuman}
        aria-label="Humano: respondés vos"
        disabled={isPending || isHuman}
        onClick={() => onChange("HUMAN")}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full py-1.5 transition-colors disabled:cursor-default",
          isHuman ? "text-white" : "text-wa-muted hover:text-wa-text",
        )}
      >
        {isPending && isHuman ? <Loader2 className="size-3.5 animate-spin" /> : <UserCog className="size-3.5" />}
        <span className="hidden sm:inline">Humano</span>
      </button>
    </div>
  );
}
