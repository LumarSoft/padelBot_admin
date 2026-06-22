"use client";

import { Bot, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ConversationSummary } from "@/types/api/conversations";

interface Props {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function truncate(text: string, max = 55): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

const ROLE_PREFIX: Record<string, string> = {
  USER: "",
  BOT: "🤖 ",
  ADMIN: "Tú: ",
};

export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  if (conversations.length === 0) {
    return (
      <p className="text-muted-foreground p-4 text-center text-sm">
        Sin conversaciones todavía.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId;
        const displayName = conv.playerName ?? conv.waId;
        const lastMsg = conv.lastMessage;

        return (
          <li key={conv.id}>
            <button
              onClick={() => onSelect(conv.id)}
              className={cn(
                "hover:bg-accent w-full cursor-pointer px-4 py-3 text-left transition-colors",
                isSelected && "bg-accent",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium text-sm">{displayName}</span>
                    {conv.mode === "HUMAN" ? (
                      <Badge
                        variant="outline"
                        className="border-amber-400 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400"
                      >
                        <UserCog className="mr-0.5 size-2.5" />
                        Humano
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-transparent px-1.5 py-0 text-[10px] text-muted-foreground"
                      >
                        <Bot className="mr-0.5 size-2.5" />
                        IA
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {lastMsg
                      ? `${ROLE_PREFIX[lastMsg.role]}${truncate(lastMsg.content)}`
                      : "Sin mensajes"}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-[11px]">
                  {timeAgo(conv.updatedAt)}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
