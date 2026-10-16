"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { conversationsService } from "@/services/conversations.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import { useChatStore } from "../stores/chat-store";
import type {
  ConversationDetail,
  ConversationMode,
  ConversationSummary,
} from "@/types/api/conversations";

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations.list,
    queryFn: () => conversationsService.list(),
    // Poll the list so new conversations / last messages surface without a reload.
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
  });
}

export function useConversationMessages(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.conversations.messages(sessionId ?? ""),
    queryFn: () => conversationsService.getMessages(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 0,
    // Poll the open thread so incoming messages appear live while it's open.
    refetchInterval: 6_000,
    refetchOnWindowFocus: true,
  });
}

interface SetModeContext {
  previousDetail?: ConversationDetail;
  previousList?: ConversationSummary[];
}

export function useSetMode(sessionId: string) {
  const queryClient = useQueryClient();
  const messagesKey = queryKeys.conversations.messages(sessionId);
  const listKey = queryKeys.conversations.list;

  return useMutation<{ mode: ConversationMode }, ApiError, ConversationMode, SetModeContext>({
    mutationFn: (mode) => conversationsService.setMode(sessionId, mode),
    // Flip the switch right away (and clear "pide asesor", as the API does): who answers the
    // chat is the one thing that must never look stale.
    onMutate: async (mode) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: messagesKey }),
        queryClient.cancelQueries({ queryKey: listKey }),
      ]);
      const previousDetail = queryClient.getQueryData<ConversationDetail>(messagesKey);
      const previousList = queryClient.getQueryData<ConversationSummary[]>(listKey);
      if (previousDetail) {
        queryClient.setQueryData<ConversationDetail>(messagesKey, {
          ...previousDetail,
          session: { ...previousDetail.session, mode, needsAdvisor: false },
        });
      }
      if (previousList) {
        queryClient.setQueryData<ConversationSummary[]>(
          listKey,
          previousList.map((c) => (c.id === sessionId ? { ...c, mode, needsAdvisor: false } : c)),
        );
      }
      return { previousDetail, previousList };
    },
    onSuccess: ({ mode }) => {
      toast.success(mode === "HUMAN" ? "Tomaste el control del chat" : "El bot vuelve a responder", {
        description:
          mode === "HUMAN"
            ? "El bot no contesta este chat hasta que lo devuelvas."
            : undefined,
      });
    },
    onError: (error, _mode, context) => {
      if (context?.previousDetail) queryClient.setQueryData(messagesKey, context.previousDetail);
      if (context?.previousList) queryClient.setQueryData(listKey, context.previousList);
      toast.error("No se pudo cambiar quién responde", { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      queryClient.invalidateQueries({ queryKey: messagesKey });
    },
  });
}

export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const messagesKey = queryKeys.conversations.messages(sessionId);

  return useMutation<unknown, ApiError, string, { tempId: string }>({
    mutationFn: (content) => conversationsService.sendMessage(sessionId, content),
    // Optimistically append the admin message so it shows up instantly with a "sending"
    // state, instead of waiting for the next poll/refetch to reveal it.
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: messagesKey });
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      queryClient.setQueryData<ConversationDetail>(messagesKey, (previous) =>
        previous
          ? {
              ...previous,
              messages: [
                ...previous.messages,
                {
                  id: tempId,
                  role: "ADMIN",
                  content,
                  createdAt: new Date().toISOString(),
                  pending: true,
                },
              ],
            }
          : previous,
      );
      return { tempId };
    },
    onError: (error, content, context) => {
      // Drop only this message (others may be in flight) and give the text back, so a failed
      // send never loses what was typed.
      queryClient.setQueryData<ConversationDetail>(messagesKey, (current) =>
        current
          ? { ...current, messages: current.messages.filter((m) => m.id !== context?.tempId) }
          : current,
      );
      const { drafts, setDraft } = useChatStore.getState();
      const draft = drafts[sessionId];
      setDraft(sessionId, draft ? `${content}\n${draft}` : content);
      toast.error("No se pudo enviar el mensaje", {
        description: `Tu texto quedó en el cuadro para reintentar. ${error.message}`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: messagesKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list });
    },
  });
}
