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
 * admin can tell at a glance who is driving the conversation — and the active half is filled.
 */
export function ModeToggle({ mode, onChange, isPending }: Props) {
  const isHuman = mode === "HUMAN";

  return (
    <div
      role="radiogroup"
      aria-label="Quién responde la conversación"
      className="bg-muted relative grid w-44 grid-cols-2 rounded-full p-0.5 text-xs font-medium"
    >
      {/* Sliding highlight — half the track, slides to the active side */}
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full shadow-sm transition-all duration-200",
          isHuman ? "left-1/2 bg-amber-500" : "left-0.5 bg-brand",
        )}
      />
      <button
        role="radio"
        aria-checked={!isHuman}
        disabled={isPending || !isHuman}
        onClick={() => onChange("AI")}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full py-1.5 transition-colors disabled:cursor-default",
          !isHuman ? "text-white" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {isPending && !isHuman ? <Loader2 className="size-3.5 animate-spin" /> : <Bot className="size-3.5" />}
        IA
      </button>
      <button
        role="radio"
        aria-checked={isHuman}
        disabled={isPending || isHuman}
        onClick={() => onChange("HUMAN")}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full py-1.5 transition-colors disabled:cursor-default",
          isHuman ? "text-white" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {isPending && isHuman ? <Loader2 className="size-3.5 animate-spin" /> : <UserCog className="size-3.5" />}
        Humano
      </button>
    </div>
  );
}
