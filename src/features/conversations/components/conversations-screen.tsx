"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/types/api/conversations";
import { useConversations } from "../hooks/use-conversations";
import { hydrateChatStore } from "../stores/chat-store";
import { digits } from "../lib/chat-format";
import { ChatIntro } from "./chat-intro";
import { ChatListPane } from "./chat-list-pane";
import { ConversationThread } from "./conversation-thread";

const BASE_PATH = "/panel/conversaciones";

/**
 * The WhatsApp inbox: chat list on the left, the open chat on the right, filling the whole
 * panel area (`data-full-bleed`). On a phone it's one pane at a time, like the app.
 */
export function ConversationsScreen() {
  const { data: conversations, isLoading, isError, refetch } = useConversations();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => hydrateChatStore(), []);

  // The open chat is driven by the URL (?waId=<phone>), so other screens (e.g. Pagos) can
  // deep-link straight to a player's chat, and the selection survives a refresh / share.
  const waIdParam = searchParams.get("waId");
  const target = waIdParam ? digits(waIdParam) : null;
  const selected = target
    ? (conversations?.find((c) => digits(c.waId) === target) ?? null)
    : null;
  const missingWaId = target && conversations && !selected ? target : null;
  // On a phone the right pane replaces the list: for the open chat, and to explain a deep link
  // to a number that has no chat yet.
  const showThread = Boolean(selected || missingWaId);

  function handleSelect(conversation: ConversationSummary): void {
    router.replace(`${BASE_PATH}?waId=${conversation.waId}`, { scroll: false });
  }

  function backToList(): void {
    router.replace(BASE_PATH, { scroll: false });
  }

  return (
    <div data-full-bleed className="bg-wa-panel flex min-h-0 flex-1 overflow-hidden">
      <div
        className={cn(
          "border-wa-line min-h-0 w-full flex-col md:flex md:w-[22rem] md:shrink-0 md:border-r lg:w-[26rem]",
          showThread ? "hidden" : "flex",
        )}
      >
        <ChatListPane
          conversations={conversations}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
        />
      </div>

      <div className={cn("min-h-0 min-w-0 flex-1 md:flex", showThread ? "flex" : "hidden")}>
        {selected ? (
          <ConversationThread key={selected.id} conversation={selected} onBack={backToList} />
        ) : (
          <ChatIntro missingWaId={missingWaId} onBack={backToList} />
        )}
      </div>
    </div>
  );
}
