"use client";

import { useState } from "react";
import { MessagesSquare, Loader2 } from "lucide-react";
import { useConversations } from "../hooks/use-conversations";
import { ConversationList } from "./conversation-list";
import { ConversationThread } from "./conversation-thread";

export function ConversationsScreen() {
  const { data: conversations, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = conversations?.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="border-border bg-background flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border">
      {/* Left panel — conversation list */}
      <div className="border-border flex w-72 shrink-0 flex-col border-r">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Conversaciones</p>
          <p className="text-muted-foreground text-xs">
            {isLoading ? "Cargando…" : `${conversations?.length ?? 0} activas`}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : (
            <ConversationList
              conversations={conversations ?? []}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>

      {/* Right panel — thread */}
      <div className="flex flex-1 flex-col">
        {selected ? (
          <ConversationThread conversation={selected} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <MessagesSquare className="text-muted-foreground size-10 opacity-40" />
            <p className="text-muted-foreground text-sm">
              Seleccioná una conversación para ver el hilo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
