"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, User, UserCog, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useConversationMessages, useSetMode, useSendMessage } from "../hooks/use-conversations";
import type { ConversationSummary, MessageRole } from "@/types/api/conversations";

interface Props {
  conversation: ConversationSummary;
}

const ROLE_CONFIG: Record<MessageRole, { label: string; Icon: typeof Bot; bubble: string; align: string }> = {
  USER: {
    label: "Jugador",
    Icon: User,
    bubble: "bg-muted text-foreground",
    align: "items-start",
  },
  BOT: {
    label: "Bot",
    Icon: Bot,
    bubble: "bg-brand/10 text-foreground border border-brand/20",
    align: "items-start",
  },
  ADMIN: {
    label: "Admin",
    Icon: UserCog,
    bubble: "bg-primary text-primary-foreground",
    align: "items-end",
  },
};

export function ConversationThread({ conversation }: Props) {
  const { data, isLoading } = useConversationMessages(conversation.id);
  const setMode = useSetMode(conversation.id);
  const sendMessage = useSendMessage(conversation.id);

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isHuman = conversation.mode === "HUMAN";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  function handleSend() {
    const content = draft.trim();
    if (!content || sendMessage.isPending) return;
    setDraft("");
    sendMessage.mutate(content);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const displayName = conversation.playerName ?? conversation.waId;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="font-semibold">{displayName}</p>
          <p className="text-muted-foreground text-xs">{conversation.waId}</p>
        </div>
        <Button
          size="sm"
          variant={isHuman ? "default" : "outline"}
          onClick={() => setMode.mutate(isHuman ? "AI" : "HUMAN")}
          disabled={setMode.isPending}
        >
          {setMode.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isHuman ? (
            <>
              <UserCog className="mr-1.5 size-4" />
              Modo humano
            </>
          ) : (
            <>
              <Bot className="mr-1.5 size-4" />
              Modo IA
            </>
          )}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}
        {!isLoading && data?.messages.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">Sin mensajes aún.</p>
        )}
        <div className="flex flex-col gap-3">
          {data?.messages.map((msg) => {
            const config = ROLE_CONFIG[msg.role];
            const Icon = config.Icon;
            return (
              <div key={msg.id} className={cn("flex flex-col gap-1", config.align)}>
                <div className={cn("flex max-w-[75%] items-start gap-2", msg.role === "ADMIN" ? "flex-row-reverse" : "flex-row")}>
                  <span className="bg-muted mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-3.5" />
                  </span>
                  <div className={cn("rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap", config.bubble)}>
                    {msg.content}
                  </div>
                </div>
                <p className="text-muted-foreground px-8 text-xs">
                  {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Admin input — only when human mode */}
      {isHuman && (
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <textarea
              className="border-input bg-background focus-visible:ring-ring flex min-h-[60px] w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
              placeholder="Escribí tu respuesta…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!draft.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">Enter para enviar · Shift+Enter para nueva línea</p>
        </div>
      )}
    </div>
  );
}
