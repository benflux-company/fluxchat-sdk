import { createContext } from 'react';

export interface FluxChatContextState {
  apiKey: string | null;
  conversationId: string | null;
  setConversationId: (id: string) => void;
}

export const FluxChatContext = createContext<FluxChatContextState>({
  apiKey: null,
  conversationId: null,
  setConversationId: () => {},
});
