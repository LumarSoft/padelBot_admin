"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Info, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationMessage } from "@/types/api/conversations";
import { dayKey, dayLabel } from "../lib/chat-format";
import { BUBBLE_SHADOW, MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

/** How close to the end still counts as "reading the latest" (auto-scroll keeps following). */
const NEAR_BOTTOM_PX = 120;

interface Day {
  key: string;
  label: string;
  messages: ConversationMessage[];
}

function groupByDay(messages: ConversationMessage[]): Day[] {
  const days: Day[] = [];
  for (const message of messages) {
    const key = dayKey(message.createdAt);
    const current = days[days.length - 1];
    if (current?.key === key) current.messages.push(message);
    else days.push({ key, label: dayLabel(message.createdAt), messages: [message] });
  }
  return days;
}

/**
 * The scrolling message area over the WhatsApp wallpaper. It opens at the latest message and
 * follows new ones only while you're at the bottom; scrolled up reading history, it leaves you
 * there and the round ⌄ button counts what arrived. Each day's pill sticks to the top while
 * its messages scroll by.
 */
export function MessageList({
  messages,
  botTyping,
  isLoading,
  isError,
  onRetry,
}: {
  messages: ConversationMessage[];
  botTyping: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const renderedCount = useRef<number | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  // How many messages had arrived the last time the reader was at the bottom.
  const [seenCount, setSeenCount] = useState(0);

  const days = useMemo(() => groupByDay(messages), [messages]);
  const unseen = atBottom ? 0 : Math.max(0, messages.length - seenCount);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const before = renderedCount.current;
    renderedCount.current = messages.length;
    if (!before) {
      // First paint with messages: open at the end, no animated trip through the history.
      el.scrollTop = el.scrollHeight;
      return;
    }
    if (messages.length > before) {
      const mine = messages[messages.length - 1]?.role === "ADMIN";
      if (atBottomRef.current || mine) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (botTyping && el && atBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [botTyping]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    atBottomRef.current = near;
    setAtBottom(near);
    if (near) setSeenCount(messages.length);
  }

  function scrollToEnd() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }

  return (
    <div className="wa-wallpaper min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto px-[4%] pb-3 xl:px-[7%]"
        role="log"
        aria-live="polite"
        aria-label="Mensajes"
      >
        <div className="flex justify-center pt-3">
          <p
            className={cn(
              "bg-wa-notice text-wa-notice-text flex max-w-md items-start gap-1.5 rounded-lg px-3 py-1.5 text-center text-[12.5px] leading-snug",
              BUBBLE_SHADOW,
            )}
          >
            <Info className="mt-px size-3.5 shrink-0" />
            Este es el chat entre el jugador y el WhatsApp del club. Mientras esté en IA, responde el
            bot; tomá el control para escribir vos.
          </p>
        </div>

        {isLoading ? (
          <BubblesSkeleton />
        ) : isError && messages.length === 0 ? (
          <div className="flex justify-center pt-10">
            <button
              type="button"
              onClick={onRetry}
              className={cn(
                "bg-wa-pill text-wa-text flex items-center gap-2 rounded-lg px-4 py-2 text-sm",
                BUBBLE_SHADOW,
              )}
            >
              <RotateCw className="size-4" />
              No pudimos cargar los mensajes. Reintentar
            </button>
          </div>
        ) : (
          days.map((day) => (
            <section key={day.key} className="relative">
              <div className="pointer-events-none sticky top-2 z-10 flex justify-center pt-3 pb-1">
                <span
                  className={cn(
                    "bg-wa-pill text-wa-muted rounded-lg px-3 py-1 text-[12.5px]",
                    BUBBLE_SHADOW,
                  )}
                >
                  {day.label}
                </span>
              </div>
              {day.messages.map((message, i) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  runStart={i === 0 || day.messages[i - 1].role !== message.role}
                />
              ))}
            </section>
          ))
        )}
        {botTyping && !isLoading && <TypingIndicator />}
      </div>

      <button
        type="button"
        onClick={scrollToEnd}
        aria-label={unseen > 0 ? `Ir al final (${unseen} nuevos)` : "Ir al final"}
        className={cn(
          "bg-wa-in text-wa-icon absolute right-5 bottom-4 flex size-11 items-center justify-center rounded-full transition-all duration-200 ease-fluid",
          "shadow-[0_1px_1px_rgba(11,20,26,0.06),0_2px_5px_rgba(11,20,26,0.2)]",
          atBottom ? "pointer-events-none translate-y-3 scale-90 opacity-0" : "opacity-100",
        )}
      >
        <ChevronDown className="size-6" />
        {unseen > 0 && (
          <span className="bg-wa-badge text-wa-badge-text absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums">
            {unseen}
          </span>
        )}
      </button>
    </div>
  );
}

function BubblesSkeleton() {
  const rows: { out: boolean; w: string }[] = [
    { out: false, w: "w-56" },
    { out: true, w: "w-72" },
    { out: true, w: "w-40" },
    { out: false, w: "w-48" },
    { out: true, w: "w-64" },
    { out: false, w: "w-32" },
  ];
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-3 pt-6">
      {rows.map((row, i) => (
        <div key={i} className={cn("flex", row.out ? "justify-end" : "justify-start")}>
          <span
            className={cn(
              "h-9 max-w-[70%] rounded-lg opacity-70",
              row.w,
              row.out ? "bg-wa-out" : "bg-wa-in",
            )}
          />
        </div>
      ))}
    </div>
  );
}
