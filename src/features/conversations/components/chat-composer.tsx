"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, SendHorizontal, Smile, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useChatStore } from "../stores/chat-store";

/** The handful a front desk actually uses — no need for a full emoji keyboard. */
const EMOJIS = [
  "😀", "😂", "😊", "🙂", "😉", "😍", "😅", "🤔", "😬", "😢", "😎", "🥳",
  "🙏", "👍", "👌", "👏", "🙌", "💪", "🤝", "👋", "🙋", "✅", "❌", "⚠️",
  "⏰", "📅", "📍", "🎾", "🏆", "🔥", "⭐", "❤️", "💚", "💸", "💰", "🧾",
  "📲", "🚗", "☀️", "🌧️",
];

/** Tallest the box grows before it scrolls (about six lines), like WhatsApp's. */
const MAX_HEIGHT_PX = 132;

/**
 * The bottom bar while a person answers the chat. Enter sends and Shift+Enter breaks the line;
 * ⌘/Ctrl+B and ⌘/Ctrl+I wrap the selection in WhatsApp's *bold* / _italic_ markers. The text
 * is a per-chat draft in the store, so switching chats or screens never loses it.
 */
export function ChatComposer({
  sessionId,
  onSend,
  onReturnToBot,
  returningToBot,
}: {
  sessionId: string;
  onSend: (content: string) => void;
  onReturnToBot: () => void;
  returningToBot: boolean;
}) {
  const draft = useChatStore((s) => s.drafts[sessionId] ?? "");
  const setDraft = useChatStore((s) => s.setDraft);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Where the caret goes after a programmatic edit (emoji, markers), applied once React wrote it.
  const nextCaret = useRef<[number, number] | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    if (nextCaret.current) {
      el.setSelectionRange(...nextCaret.current);
      nextCaret.current = null;
    }
  }, [draft]);

  // Ready to type the moment the chat is taken over or opened.
  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, [sessionId]);

  function send() {
    const content = draft.trim();
    if (!content) return;
    setDraft(sessionId, "");
    onSend(content);
    textareaRef.current?.focus();
  }

  function replaceSelection(build: (selected: string) => string, caretOffset: (inserted: string) => [number, number]) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const inserted = build(draft.slice(start, end));
    const [from, to] = caretOffset(inserted);
    nextCaret.current = [start + from, start + to];
    setDraft(sessionId, draft.slice(0, start) + inserted + draft.slice(end));
  }

  function wrap(marker: string) {
    replaceSelection(
      (selected) => `${marker}${selected}${marker}`,
      (inserted) =>
        inserted.length === marker.length * 2
          ? [marker.length, marker.length]
          : [marker.length, inserted.length - marker.length],
    );
  }

  function insertEmoji(emoji: string) {
    replaceSelection(
      () => emoji,
      () => [emoji.length, emoji.length],
    );
    setEmojiOpen(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
      const key = event.key.toLowerCase();
      if (key === "b" || key === "i") {
        event.preventDefault();
        wrap(key === "b" ? "*" : "_");
      }
    }
  }

  const canSend = draft.trim().length > 0;

  return (
    <footer className="bg-wa-bar shrink-0">
      <p className="text-wa-muted flex flex-wrap items-center justify-center gap-x-1.5 px-4 pt-2 text-center text-xs">
        <UserCog className="size-3.5" />
        Estás respondiendo vos: el bot no contesta este chat.
        <button
          type="button"
          onClick={onReturnToBot}
          disabled={returningToBot}
          className="text-wa-green-text inline-flex items-center gap-1 font-medium hover:underline disabled:opacity-60"
        >
          {returningToBot && <Loader2 className="size-3 animate-spin" />}
          Devolver al bot
        </button>
      </p>
      <div className="flex items-end gap-2 px-3 py-2.5 sm:px-4">
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label="Emojis"
                className={cn(
                  "text-wa-icon hover:bg-wa-hover flex size-[42px] shrink-0 items-center justify-center rounded-full transition-colors",
                  emojiOpen && "text-wa-green-text",
                )}
              />
            }
          >
            <Smile className="size-6" />
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-[19.5rem] p-2">
            <div className="grid grid-cols-8 gap-0.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="hover:bg-muted flex size-9 items-center justify-center rounded-md text-xl transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="bg-wa-field flex min-h-[42px] flex-1 items-center rounded-lg px-3 py-[9px]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(sessionId, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje"
            aria-label="Mensaje"
            className="text-wa-text placeholder:text-wa-muted block max-h-[132px] w-full resize-none bg-transparent text-[15px] leading-[20px] outline-none"
          />
        </div>

        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label="Enviar"
          title="Enviar (Enter)"
          className={cn(
            "flex size-[42px] shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-fluid",
            canSend
              ? "bg-wa-green text-white hover:brightness-105 active:scale-90"
              : "text-wa-icon",
          )}
        >
          <SendHorizontal className="size-5" />
        </button>
      </div>
    </footer>
  );
}
