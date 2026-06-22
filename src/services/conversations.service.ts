import { apiClient } from "@/lib/api/client";
import type {
  ConversationDetail,
  ConversationMode,
  ConversationSummary,
  ConversationMessage,
} from "@/types/api/conversations";

export const conversationsService = {
  list(): Promise<ConversationSummary[]> {
    return apiClient.get<ConversationSummary[]>("/api/conversations");
  },

  getMessages(id: string): Promise<ConversationDetail> {
    return apiClient.get<ConversationDetail>(`/api/conversations/${id}/messages`);
  },

  setMode(id: string, mode: ConversationMode): Promise<{ mode: ConversationMode }> {
    return apiClient.patch<{ mode: ConversationMode }>(
      `/api/conversations/${id}/mode`,
      { mode },
    );
  },

  sendMessage(id: string, content: string): Promise<ConversationMessage> {
    return apiClient.post<ConversationMessage>(
      `/api/conversations/${id}/messages`,
      { content },
    );
  },
};
