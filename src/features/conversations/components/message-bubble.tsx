"use client";

import { Bot, Camera, Check, Clock3, Mic, Paperclip, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationMessage } from "@/types/api/conversations";
import { emojiOnlyCount, mediaPlaceholder, messageTime } from "../lib/chat-format";
import { WaText } from "./wa-text";

/** WhatsApp's tiny bubble shadow. */
export const BUBBLE_SHADOW = "shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]";

/**
 * The little tail on the first bubble of a run: a right triangle hanging off the top corner,
 * which is squared off for it.
 */
export const TAIL_IN =
  "rounded-tl-none before:absolute before:top-0 before:-left-2 before:h-[13px] before:w-2 before:bg-wa-in before:content-[''] before:[clip-path:polygon(0_0,100%_0,100%_100%)]";
export const TAIL_OUT =
  "rounded-tr-none before:absolute before:top-0 before:-right-2 before:h-[13px] before:w-2 before:bg-wa-out before:content-[''] before:[clip-path:polygon(0_0,100%_0,0_100%)]";

function MediaLabel({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const Icon =
    lower.includes("imagen") || lower.includes("foto") ? Camera : lower.includes("audio") ? Mic : Paperclip;
  return (
    <span className="text-wa-muted inline-flex items-center gap-1.5 italic">
      <Icon className="size-4 shrink-0" />
      {label}
    </span>
  );
}

/**
 * One message, WhatsApp style. The club's side — the bot and the staff — goes on the right in
 * green (it's the club's WhatsApp); the player's on the left in white. The first bubble of a
 * run gets the tail and, on the club's side, who wrote it (the bot or the team), since staff
 * need to tell them apart. Time and ticks sit inside the bubble, bottom-right, with an
 * invisible spacer so the last line of text wraps around them.
 */
export function MessageBubble({
  message,
  runStart,
}: {
  message: ConversationMessage;
  /** First of consecutive messages from the same sender. */
  runStart: boolean;
}) {
  const outgoing = message.role !== "USER";
  const media = mediaPlaceholder(message.content);
  const emoji = media ? 0 : emojiOnlyCount(message.content);
  const jumbo = emoji > 0 && emoji <= 3;

  return (
    <div
      className={cn(
        "flex",
        outgoing ? "justify-end" : "justify-start",
        runStart ? "mt-3" : "mt-0.5",
      )}
    >
      <div
        className={cn(
          "text-wa-text relative max-w-[85%] rounded-lg px-2 pt-1.5 pb-2 text-[14.2px] leading-[19px] md:max-w-[65%]",
          BUBBLE_SHADOW,
          outgoing ? "bg-wa-out" : "bg-wa-in",
          runStart && (outgoing ? TAIL_OUT : TAIL_IN),
          message.pending && "opacity-80",
        )}
      >
        {runStart && outgoing && <SenderLabel role={message.role} />}
        {media ? (
          <MediaLabel label={media} />
        ) : (
          <span
            className={cn(
              "break-words whitespace-pre-wrap [overflow-wrap:anywhere]",
              jumbo && (emoji === 1 ? "text-[44px] leading-[52px]" : "text-[34px] leading-[42px]"),
            )}
          >
            <WaText text={message.content} />
          </span>
        )}
        {/* Reserves the corner the time sits in, so text never runs under it. */}
        <span aria-hidden className={cn("inline-block", outgoing ? "w-[4.1rem]" : "w-[2.9rem]")} />
        <span className="text-wa-meta absolute right-2 bottom-1 flex items-center gap-1 text-[11px] leading-none tabular-nums">
          {messageTime(message.createdAt)}
          {outgoing &&
            (message.pending ? (
              <Clock3 className="size-3" aria-label="Enviando" />
            ) : (
              <Check className="size-3.5" aria-label="Enviado" />
            ))}
        </span>
      </div>
    </div>
  );
}

/** Like a group chat's sender name: who on the club's side wrote this run. */
function SenderLabel({ role }: { role: ConversationMessage["role"] }) {
  if (role === "BOT") {
    return (
      <p className="text-wa-green-text mb-0.5 flex items-center gap-1 text-[12.8px] font-medium">
        <Bot className="size-3.5" />
        Bot
      </p>
    );
  }
  return (
    <p className="mb-0.5 flex items-center gap-1 text-[12.8px] font-medium text-[#c4650a] dark:text-[#f5a85a]">
      <UserRound className="size-3.5" />
      Equipo del club
    </p>
  );
}
