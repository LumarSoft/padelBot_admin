"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { conversationsService } from "@/services/conversations.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type { ConversationMode } from "@/types/api/conversations";

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations.list,
    queryFn: () => conversationsService.list(),
    refetchInterval: 30_000,
  });
}

export function useConversationMessages(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.conversations.messages(sessionId ?? ""),
    queryFn: () => conversationsService.getMessages(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 0,
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

  return useMutation<unknown, ApiError, string>({
    mutationFn: (content) => conversationsService.sendMessage(sessionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.messages(sessionId),
      });
    },
    onError: (error) => toast.error(error.message),
  });
}
