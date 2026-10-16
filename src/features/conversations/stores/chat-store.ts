import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * The WhatsApp inbox's client-side state, none of which the API knows about:
 *
 * - `drafts`: what was typed in each chat and not sent. In memory (like the POS ticket): it
 *   survives switching chats or screens, and the list shows it as "Borrador: …", as WhatsApp does.
 * - `readUpTo`: per chat, the time of the last message this browser has seen. A chat whose
 *   latest message is the player's and is newer than that shows WhatsApp's green unread dot.
 * - `muted`: silences the chat alert sound on this computer.
 *
 * `readUpTo` and `muted` persist in localStorage. Hydration is manual (`skipHydration`), so
 * the server render and the first client render agree; `hydrateChatStore()` runs it.
 */
interface ChatState {
  drafts: Record<string, string>;
  readUpTo: Record<string, string>;
  muted: boolean;
  setDraft: (sessionId: string, text: string) => void;
  markRead: (sessionId: string, lastMessageAt: string) => void;
  toggleMuted: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      drafts: {},
      readUpTo: {},
      muted: false,
      setDraft: (sessionId, text) =>
        set((state) => {
          const drafts = { ...state.drafts };
          if (text) drafts[sessionId] = text;
          else delete drafts[sessionId];
          return { drafts };
        }),
      markRead: (sessionId, lastMessageAt) =>
        set((state) =>
          state.readUpTo[sessionId] && state.readUpTo[sessionId] >= lastMessageAt
            ? state
            : { readUpTo: { ...state.readUpTo, [sessionId]: lastMessageAt } },
        ),
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
    }),
    {
      name: "gtp:whatsapp-inbox",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ readUpTo, muted }) => ({ readUpTo, muted }),
      skipHydration: true,
    },
  ),
);

/** Loads the persisted part once on the client. Safe to call from several components. */
export function hydrateChatStore(): void {
  if (!useChatStore.persist.hasHydrated()) void useChatStore.persist.rehydrate();
}
