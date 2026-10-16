"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bot, ExternalLink, Headset, Loader2, PanelRight, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";
import type { ConversationSummary } from "@/types/api/conversations";
import { useConversationMessages, useSetMode, useSendMessage } from "../hooks/use-conversations";
import { useChatStore } from "../stores/chat-store";
import { displayName, formatPhone, isBotTyping } from "../lib/chat-format";
import { ChatComposer } from "./chat-composer";
import { ContactInfoPanel } from "./contact-info-panel";
import { MessageList } from "./message-list";
import { ModeToggle } from "./mode-toggle";
import { WaAvatar } from "./wa-avatar";

interface Props {
  conversation: ConversationSummary;
  /** Back to the list (the phone layout shows one pane at a time). */
  onBack: () => void;
}

/**
 * The open chat, WhatsApp Web style: header (tap it for the contact's info), messages over the
 * wallpaper, and at the bottom either the composer (a person is answering) or the bar that
 * says the bot is, with the button to take over. Opening it marks it read on this computer.
 */
export function ConversationThread({ conversation, onBack }: Props) {
  const { data, isLoading, isError, refetch } = useConversationMessages(conversation.id);
  const setMode = useSetMode(conversation.id);
  const sendMessage = useSendMessage(conversation.id);
  const markRead = useChatStore((s) => s.markRead);
  const [infoOpen, setInfoOpen] = useState(false);
  const closeInfo = useCallback(() => setInfoOpen(false), []);

  // Prefer the richer session payload from the thread endpoint; fall back to the list summary.
  const session = data?.session ?? null;
  const mode = session?.mode ?? conversation.mode;
  const isHuman = mode === "HUMAN";
  const needsAdvisor = session?.needsAdvisor ?? conversation.needsAdvisor;
  const messages = data?.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const botTyping = isBotTyping({ mode, lastMessage: lastMessage ?? null });

  // Read up to the newest delivered message (an optimistic one carries this computer's clock).
  const lastDeliveredAt = messages.findLast((m) => !m.pending)?.createdAt;
  useEffect(() => {
    if (lastDeliveredAt) markRead(conversation.id, lastDeliveredAt);
  }, [conversation.id, lastDeliveredAt, markRead]);

  const name = displayName(conversation);
  const subtitle = botTyping
    ? "escribiendo…"
    : conversation.playerName
      ? formatPhone(conversation.waId)
      : "Tocá acá para ver la info del contacto";

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="bg-wa-bar flex h-16 shrink-0 items-center gap-2 pr-3 pl-2 sm:pl-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver a los chats"
            className="text-wa-icon hover:bg-wa-hover flex size-9 shrink-0 items-center justify-center rounded-full transition-colors md:hidden"
          >
            <ArrowLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setInfoOpen((open) => !open)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left"
            aria-expanded={infoOpen}
          >
            <WaAvatar className="size-10" />
            <span className="min-w-0">
              <span className="text-wa-text block truncate text-base leading-tight">{name}</span>
              <span
                className={cn(
                  "block truncate text-[13px] leading-tight",
                  botTyping ? "text-wa-green-text" : "text-wa-muted",
                )}
              >
                {subtitle}
              </span>
            </span>
          </button>

          {needsAdvisor && (
            <span className="hidden h-7 shrink-0 items-center gap-1 rounded-full bg-amber-500 px-2.5 text-xs font-semibold text-white lg:flex">
              <Headset className="size-3.5" />
              Pide asesor
            </span>
          )}
          <ModeToggle
            mode={mode}
            onChange={(next) => setMode.mutate(next)}
            isPending={setMode.isPending}
          />
          <a
            href={waLink(conversation.waId)}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir en WhatsApp"
            className="text-wa-icon hover:bg-wa-hover hidden size-10 shrink-0 items-center justify-center rounded-full transition-colors sm:flex"
          >
            <ExternalLink className="size-5" />
            <span className="sr-only">Abrir en WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={() => setInfoOpen((open) => !open)}
            title="Info del contacto"
            aria-pressed={infoOpen}
            className={cn(
              "text-wa-icon hover:bg-wa-hover flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
              infoOpen && "bg-wa-active",
            )}
          >
            <PanelRight className="size-5" />
            <span className="sr-only">Info del contacto</span>
          </button>
        </header>

        <MessageList
          messages={messages}
          botTyping={botTyping}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
        />

        {isHuman ? (
          <ChatComposer
            sessionId={conversation.id}
            onSend={(content) => sendMessage.mutate(content)}
            onReturnToBot={() => setMode.mutate("AI")}
            returningToBot={setMode.isPending}
          />
        ) : (
          <footer className="bg-wa-bar flex shrink-0 flex-col items-center justify-center gap-2.5 px-4 py-3 text-center sm:flex-row sm:gap-4">
            <p className="text-wa-muted flex items-center gap-1.5 text-sm">
              <Bot className="size-4 shrink-0" />
              El bot está respondiendo este chat.
            </p>
            <button
              type="button"
              onClick={() => setMode.mutate("HUMAN")}
              disabled={setMode.isPending}
              className="bg-wa-green flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70"
            >
              {setMode.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserCog className="size-4" />}
              Tomar el control
            </button>
          </footer>
        )}
      </div>

      {infoOpen && (
        <ContactInfoPanel conversation={conversation} session={session} onClose={closeInfo} />
      )}
    </div>
  );
}
