"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Bot,
  Camera,
  Check,
  Headset,
  Mic,
  Paperclip,
  RotateCw,
  Search,
  UserCog,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/types/api/conversations";
import { useChatStore } from "../stores/chat-store";
import {
  chatListTime,
  digits,
  displayName,
  isBotTyping,
  isUnread,
  mediaPlaceholder,
} from "../lib/chat-format";
import { stripWaMarkup } from "./wa-text";
import { WaAvatar } from "./wa-avatar";

type ChatFilter = "all" | "unread" | "advisor" | "human";

interface Props {
  conversations: ConversationSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedId: string | null;
  onSelect: (conversation: ConversationSummary) => void;
}

/**
 * The left pane of the WhatsApp inbox: title, search, filter chips and the chat list, laid out
 * like WhatsApp Web. The chips are the club's own: "No leídos" (the player wrote last and nobody
 * opened it here), "Pide asesor" and "Humano" (chats a person is answering).
 */
export function ChatListPane({
  conversations,
  isLoading,
  isError,
  onRetry,
  selectedId,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ChatFilter>("all");
  const readUpTo = useChatStore((s) => s.readUpTo);
  const drafts = useChatStore((s) => s.drafts);
  const muted = useChatStore((s) => s.muted);
  const toggleMuted = useChatStore((s) => s.toggleMuted);

  const all = useMemo(() => conversations ?? [], [conversations]);
  const counts = useMemo(
    () => ({
      unread: all.filter((c) => c.id !== selectedId && isUnread(c, readUpTo)).length,
      advisor: all.filter((c) => c.needsAdvisor).length,
      human: all.filter((c) => c.mode === "HUMAN").length,
    }),
    [all, readUpTo, selectedId],
  );

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    const number = digits(query);
    return all.filter((c) => {
      if (filter === "unread" && !(c.id === selectedId || isUnread(c, readUpTo))) return false;
      if (filter === "advisor" && !c.needsAdvisor) return false;
      if (filter === "human" && c.mode !== "HUMAN") return false;
      if (!text) return true;
      return (
        displayName(c).toLowerCase().includes(text) ||
        (number.length >= 3 && digits(c.waId).includes(number)) ||
        (c.lastMessage?.content.toLowerCase().includes(text) ?? false)
      );
    });
  }, [all, filter, query, readUpTo, selectedId]);

  const chips: { id: ChatFilter; label: string; count?: number }[] = [
    { id: "all", label: "Todos" },
    { id: "unread", label: "No leídos", count: counts.unread },
    { id: "advisor", label: "Pide asesor", count: counts.advisor },
    { id: "human", label: "Humano", count: counts.human },
  ];

  return (
    <section className="bg-wa-panel flex min-h-0 flex-1 flex-col" aria-label="Chats">
      <header className="flex h-16 shrink-0 items-center justify-between pr-3 pl-5">
        <h1 className="text-wa-text text-[22px] font-bold tracking-tight">WhatsApp</h1>
        <button
          type="button"
          onClick={toggleMuted}
          aria-pressed={!muted}
          title={muted ? "Activar el sonido de los avisos" : "Silenciar el sonido de los avisos"}
          className="text-wa-icon hover:bg-wa-hover flex size-10 items-center justify-center rounded-full transition-colors"
        >
          {muted ? <BellOff className="size-5" /> : <Bell className="size-5" />}
          <span className="sr-only">{muted ? "Activar sonido" : "Silenciar sonido"}</span>
        </button>
      </header>

      <div className="shrink-0 px-3 pb-2">
        <label className="bg-wa-search focus-within:ring-wa-green/60 flex h-9 items-center gap-3 rounded-full px-4 ring-1 ring-transparent transition-shadow">
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Borrar búsqueda"
              className="text-wa-green-text"
            >
              <ArrowLeft className="size-4" />
            </button>
          ) : (
            <Search className="text-wa-icon size-4 shrink-0" />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="Buscar un chat, número o mensaje"
            className="text-wa-text placeholder:text-wa-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda">
              <X className="text-wa-icon size-4" />
            </button>
          )}
        </label>
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto px-3 pb-2.5 [scrollbar-width:none]" role="tablist">
        {chips.map((chip) => {
          const active = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(chip.id)}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm whitespace-nowrap transition-colors",
                active
                  ? "bg-wa-chip-active text-wa-green-text font-medium"
                  : "bg-wa-chip text-wa-muted hover:text-wa-text",
              )}
            >
              {chip.label}
              {!!chip.count && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] leading-[18px] font-semibold tabular-nums",
                    chip.id === "advisor"
                      ? "bg-amber-500 text-white"
                      : "bg-wa-badge text-wa-badge-text",
                  )}
                >
                  {chip.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <ListSkeleton />
        ) : isError && !conversations ? (
          <div className="flex flex-col items-center gap-3 px-8 py-12 text-center">
            <p className="text-wa-muted text-sm">No pudimos cargar los chats.</p>
            <button
              type="button"
              onClick={onRetry}
              className="text-wa-green-text flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              <RotateCw className="size-4" /> Reintentar
            </button>
          </div>
        ) : all.length === 0 ? (
          <p className="text-wa-muted px-8 py-12 text-center text-sm text-balance">
            Todavía no hay chats. Cuando un jugador le escriba al WhatsApp del club, aparece acá.
          </p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-8 py-12 text-center">
            <p className="text-wa-muted text-sm">
              {query ? `No hay chats que coincidan con «${query.trim()}».` : "No hay chats en este filtro."}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="text-wa-green-text text-sm font-medium hover:underline"
            >
              Ver todos los chats
            </button>
          </div>
        ) : (
          <ul>
            {visible.map((c) => (
              <li key={c.id}>
                <ChatListItem
                  conversation={c}
                  selected={c.id === selectedId}
                  unread={c.id !== selectedId && isUnread(c, readUpTo)}
                  draft={c.id !== selectedId ? drafts[c.id] : undefined}
                  onSelect={() => onSelect(c)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function MediaIcon({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const Icon = lower.includes("imagen") || lower.includes("foto") ? Camera : lower.includes("audio") ? Mic : Paperclip;
  return <Icon className="size-4 shrink-0" />;
}

function ChatListItem({
  conversation,
  selected,
  unread,
  draft,
  onSelect,
}: {
  conversation: ConversationSummary;
  selected: boolean;
  unread: boolean;
  draft?: string;
  onSelect: () => void;
}) {
  const last = conversation.lastMessage;
  const typing = isBotTyping(conversation);
  const media = last ? mediaPlaceholder(last.content) : null;
  const attention = unread || conversation.needsAdvisor;

  let preview;
  if (draft) {
    preview = (
      <>
        <span className="text-wa-green-text shrink-0">Borrador:</span>
        <span className="truncate">{draft}</span>
      </>
    );
  } else if (typing) {
    preview = <span className="text-wa-green-text">escribiendo…</span>;
  } else if (last) {
    preview = (
      <>
        {last.role === "ADMIN" && <Check className="size-4 shrink-0" aria-label="Enviado por el equipo" />}
        {last.role === "BOT" && <Bot className="size-4 shrink-0" aria-label="Respondió el bot" />}
        {media ? (
          <>
            <MediaIcon label={media} />
            <span className="truncate">{media}</span>
          </>
        ) : (
          <span className="truncate">{stripWaMarkup(last.content)}</span>
        )}
      </>
    );
  } else {
    preview = <span className="truncate italic">Sin mensajes</span>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      data-help="chats-item"
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group flex w-full items-center gap-3 pl-3 text-left transition-colors",
        selected ? "bg-wa-active" : "hover:bg-wa-hover",
      )}
    >
      <WaAvatar className="size-[49px]" />
      <div className="border-wa-line flex min-w-0 flex-1 flex-col justify-center border-b py-3 pr-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-wa-text truncate text-[16px]">{displayName(conversation)}</span>
          <span
            className={cn(
              "shrink-0 text-xs tabular-nums",
              attention ? "text-wa-green-text font-medium" : "text-wa-muted",
            )}
          >
            {chatListTime(conversation.updatedAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span
            className={cn(
              "flex min-w-0 items-center gap-1 text-sm",
              unread ? "text-wa-text" : "text-wa-muted",
            )}
          >
            {preview}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {conversation.mode === "HUMAN" && !conversation.needsAdvisor && (
              <UserCog className="text-wa-muted size-4" aria-label="Lo atiende una persona" />
            )}
            {conversation.needsAdvisor ? (
              <span className="flex h-5 items-center gap-1 rounded-full bg-amber-500 px-2 text-[11px] font-semibold text-white">
                <Headset className="size-3" />
                Asesor
              </span>
            ) : (
              unread && (
                <span className="bg-wa-badge size-3 rounded-full" aria-label="Sin leer" />
              )
            )}
          </span>
        </div>
      </div>
    </button>
  );
}

function ListSkeleton() {
  return (
    <ul aria-hidden className="animate-pulse">
      {Array.from({ length: 9 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 pl-3">
          <span className="bg-wa-chip size-[49px] shrink-0 rounded-full" />
          <span className="border-wa-line flex flex-1 flex-col gap-2 border-b py-4 pr-4">
            <span className="bg-wa-chip h-3.5 rounded" style={{ width: `${45 + ((i * 17) % 35)}%` }} />
            <span className="bg-wa-chip h-3 rounded" style={{ width: `${60 + ((i * 23) % 30)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
