"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { playChatSound } from "@/features/realtime/lib/play-cash-sound";
import type { ConversationSummary } from "@/types/api/conversations";
import { useConversations } from "./use-conversations";
import { hydrateChatStore, useChatStore } from "../stores/chat-store";
import { digits, displayName, mediaPlaceholder } from "../lib/chat-format";
import { stripWaMarkup } from "../components/wa-text";

/** Most alerts toasted at once; a burst beyond that collapses into one summary. */
const MAX_TOASTS = 3;

interface Snapshot {
  needsAdvisor: boolean;
  lastAt?: string;
}

/** The chat a person owes an answer to: they took it, and the player wrote last. */
function awaitsTeam(c: ConversationSummary): boolean {
  return c.needsAdvisor || (c.mode === "HUMAN" && c.lastMessage?.role === "USER");
}

/** True when that exact chat is open on screen right now — no need to alert about it. */
function isOnScreen(c: ConversationSummary): boolean {
  if (document.visibilityState !== "visible") return false;
  if (window.location.pathname !== "/panel/conversaciones") return false;
  const open = new URLSearchParams(window.location.search).get("waId");
  return open !== null && digits(open) === digits(c.waId);
}

function preview(content: string): string {
  const text = mediaPlaceholder(content) ?? stripWaMarkup(content);
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

/**
 * Mounted once in the panel (RealtimeSync), on every screen: when a player asks for a person,
 * or writes in a chat a person is answering, it plays the soft chat cue and toasts with a button
 * straight to that chat — the bot can't answer those, so someone has to notice. It's driven by
 * the conversation list the panel already polls (and the SSE refreshes), and the first snapshot
 * is seeded silently. The browser tab also shows "(N)" chats waiting, like WhatsApp Web.
 */
export function useConversationAlerts(): void {
  const { data } = useConversations();
  const router = useRouter();
  const seen = useRef<Map<string, Snapshot> | null>(null);

  useEffect(() => hydrateChatStore(), []);

  useEffect(() => {
    if (!data) return;
    const previous = seen.current;
    seen.current = new Map(
      data.map((c) => [c.id, { needsAdvisor: c.needsAdvisor, lastAt: c.lastMessage?.createdAt }]),
    );
    if (previous === null) return;

    const alerts: { conversation: ConversationSummary; kind: "advisor" | "message" }[] = [];
    for (const c of data) {
      const before = previous.get(c.id);
      if (isOnScreen(c)) continue;
      if (c.needsAdvisor && !before?.needsAdvisor) {
        alerts.push({ conversation: c, kind: "advisor" });
      } else if (
        c.mode === "HUMAN" &&
        c.lastMessage?.role === "USER" &&
        c.lastMessage.createdAt !== before?.lastAt
      ) {
        alerts.push({ conversation: c, kind: "message" });
      }
    }
    if (alerts.length === 0) return;

    if (!useChatStore.getState().muted) playChatSound();
    const open = (c: ConversationSummary) =>
      router.push(`/panel/conversaciones?waId=${c.waId}`);

    if (alerts.length > MAX_TOASTS) {
      toast(`💬 ${alerts.length} chats esperan una respuesta`, {
        description: "El bot no los contesta: los atiende alguien del club.",
        action: { label: "Ver chats", onClick: () => router.push("/panel/conversaciones") },
        duration: 12_000,
      });
      return;
    }
    for (const { conversation: c, kind } of alerts) {
      if (kind === "advisor") {
        // Neutral on purpose: the bot also hands chats over for a torneo sign-up, not only
        // when the player asks for a person.
        toast(`🙋 ${displayName(c)} espera que le responda alguien del club`, {
          description: "El bot le pasó el chat al equipo y no va a contestar.",
          action: { label: "Abrir chat", onClick: () => open(c) },
          duration: 15_000,
        });
      } else {
        toast(`💬 ${displayName(c)}`, {
          description: c.lastMessage ? preview(c.lastMessage.content) : undefined,
          action: { label: "Responder", onClick: () => open(c) },
          duration: 10_000,
        });
      }
    }
  }, [data, router]);

  // "(2) GTP — Gestiona tu padel": what's waiting, visible from any other tab. Next rewrites the
  // title on every navigation (even a ?query change), so the prefix is re-applied whenever the
  // <title> changes; applying it is idempotent, so its own write doesn't loop.
  const waiting = data?.filter(awaitsTeam).length ?? 0;
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(/^\(\d+\) /, "");
      const next = waiting > 0 ? `(${waiting}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [waiting]);
}
