"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  User,
  UserCog,
  Send,
  Loader2,
  Check,
  Clock,
  CalendarCheck,
  CalendarClock,
  IdCard,
  Headset,
  MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDay, formatTime } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { useConversationMessages, useSetMode, useSendMessage } from "../hooks/use-conversations";
import { ModeToggle } from "./mode-toggle";
import { TypingIndicator } from "./typing-indicator";
import type {
  ConversationDetail,
  ConversationMessage,
  ConversationSummary,
  MessageRole,
} from "@/types/api/conversations";

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

/** Human-readable label for the bot's internal FSM state, for the header status chip. */
const STATE_LABELS: Record<string, string> = {
  IDLE: "Inactivo",
  MENU: "En el menú",
  BOOK_DATE: "Eligiendo fecha",
  BOOK_NAME: "Ingresando nombre",
  BOOK_COURT: "Eligiendo cancha",
  BOOK_SLOT: "Eligiendo horario",
  BOOK_CONFIRM: "Confirmando reserva",
  BOOK_DNI: "Ingresando DNI",
};

/** Initials for the avatar — first two words, or the leading digits of the phone. */
function initials(name: string | null, waId: string): string {
  if (name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }
  return waId.slice(-2);
}

/** "+54 9 11 1234-5678"-ish display for a raw waId (best-effort, non-AR falls back to "+digits"). */
function formatPhone(waId: string): string {
  const d = waId.replace(/\D/g, "");
  return `+${d}`;
}

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

function dayDivider(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return formatDay(iso);
}

export function ConversationThread({ conversation }: Props) {
  const { data, isLoading } = useConversationMessages(conversation.id);
  const setMode = useSetMode(conversation.id);
  const sendMessage = useSendMessage(conversation.id);

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Prefer the richer session payload from the thread endpoint; fall back to the list summary.
  const session: ConversationDetail["session"] | null = data?.session ?? null;
  const mode = session?.mode ?? conversation.mode;
  const isHuman = mode === "HUMAN";
  const messages = data?.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  // Bot is "typing" when the player's message is the latest and the bot (AI mode) owes a reply.
  const botTyping = !isHuman && lastMessage?.role === "USER";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages, botTyping]);

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

  const displayName = conversation.playerName ?? formatPhone(conversation.waId);
  const stateLabel = session ? STATE_LABELS[session.state] : undefined;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-brand/15 text-brand flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {initials(conversation.playerName, conversation.waId)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{displayName}</p>
              <a
                href={waLink(conversation.waId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                {formatPhone(conversation.waId)}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session?.needsAdvisor && (
              <Badge className="bg-amber-500 text-white">
                <Headset className="size-3" />
                Pide asesor
              </Badge>
            )}
            <ModeToggle
              mode={mode}
              onChange={(next) => setMode.mutate(next)}
              isPending={setMode.isPending}
            />
          </div>
        </div>

        {/* Player info chips */}
        {session && (
          <div className="flex flex-wrap items-center gap-1.5">
            {stateLabel && (
              <Badge variant="outline" className="gap-1">
                <MessageSquareText className="size-3" />
                {stateLabel}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <CalendarCheck className="size-3" />
              {session.bookingsConfirmed} {session.bookingsConfirmed === 1 ? "reserva" : "reservas"}
            </Badge>
            {session.nextBooking && (
              <Badge variant="outline" className="gap-1">
                <CalendarClock className="size-3" />
                Próxima: {formatDay(session.nextBooking.startsAt)} · {session.nextBooking.courtName}
              </Badge>
            )}
            {session.playerDni && (
              <Badge variant="outline" className="gap-1">
                <IdCard className="size-3" />
                DNI {session.playerDni}
              </Badge>
            )}
            <span className="text-muted-foreground ml-auto text-[11px]">
              Cliente desde {formatDay(session.createdAt)}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">Sin mensajes aún.</p>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              showDivider={i === 0 || dayKey(msg.createdAt) !== dayKey(messages[i - 1].createdAt)}
            />
          ))}
          {botTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Admin input — only when human mode */}
      {isHuman ? (
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
            <Button size="icon" onClick={handleSend} disabled={!draft.trim() || sendMessage.isPending}>
              {sendMessage.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      ) : (
        <div className="text-muted-foreground border-t px-4 py-3 text-center text-xs">
          <Bot className="mr-1 inline size-3.5 align-text-bottom" />
          La IA está respondiendo automáticamente. Cambiá a <span className="font-medium">Humano</span> para responder vos.
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg, showDivider }: { msg: ConversationMessage; showDivider: boolean }) {
  const config = ROLE_CONFIG[msg.role];
  const Icon = config.Icon;
  const isAdmin = msg.role === "ADMIN";

  return (
    <>
      {showDivider && (
        <div className="my-2 flex items-center justify-center">
          <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-[11px] font-medium">
            {dayDivider(msg.createdAt)}
          </span>
        </div>
      )}
      <div className={cn("flex flex-col gap-1", config.align)}>
        <div className={cn("flex max-w-[75%] items-start gap-2", isAdmin ? "flex-row-reverse" : "flex-row")}>
          <span className="bg-muted mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
            <Icon className="size-3.5" />
          </span>
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
              config.bubble,
              msg.pending && "opacity-70",
            )}
          >
            {msg.content}
          </div>
        </div>
        <p
          className={cn(
            "text-muted-foreground flex items-center gap-1 px-8 text-xs",
            isAdmin && "flex-row-reverse",
          )}
        >
          {formatTime(msg.createdAt)}
          {isAdmin &&
            (msg.pending ? (
              <Clock className="size-3" aria-label="Enviando" />
            ) : (
              <Check className="size-3" aria-label="Enviado" />
            ))}
        </p>
      </div>
    </>
  );
}
