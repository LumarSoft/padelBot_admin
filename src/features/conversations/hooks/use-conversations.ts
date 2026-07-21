"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { conversationsService } from "@/services/conversations.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type { ConversationDetail, ConversationMode } from "@/types/api/conversations";

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

export function useSetMode(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ mode: ConversationMode }, ApiError, ConversationMode>({
    mutationFn: (mode) => conversationsService.setMode(sessionId, mode),
    onSuccess: ({ mode }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.messages(sessionId),
      });
      toast.success(mode === "HUMAN" ? "Modo humano activado" : "Modo IA activado");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const messagesKey = queryKeys.conversations.messages(sessionId);

  return useMutation<unknown, ApiError, string, { previous?: ConversationDetail }>({
    mutationFn: (content) => conversationsService.sendMessage(sessionId, content),
    // Optimistically append the admin message so it shows up instantly with a "sending"
    // state, instead of waiting for the next poll/refetch to reveal it.
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: messagesKey });
      const previous = queryClient.getQueryData<ConversationDetail>(messagesKey);
      if (previous) {
        queryClient.setQueryData<ConversationDetail>(messagesKey, {
          ...previous,
          messages: [
            ...previous.messages,
            {
              id: `temp-${Date.now()}`,
              role: "ADMIN",
              content,
              createdAt: new Date().toISOString(),
              pending: true,
            },
          ],
        });
      }
      return { previous };
    },
    onError: (error, _content, context) => {
      if (context?.previous) queryClient.setQueryData(messagesKey, context.previous);
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: messagesKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list });
    },
  });
}
