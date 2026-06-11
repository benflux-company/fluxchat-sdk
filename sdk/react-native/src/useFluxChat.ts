import { useState, useContext, useEffect } from 'react';
import { FluxChatContext } from './fluxchatContext';

export function useFluxChat(apiKey?: string) {
  const context = useContext(FluxChatContext);
  const effectiveApiKey = apiKey || context.apiKey;
  const [conversationId, setConversationId] = useState<string | null>(context.conversationId);

  useEffect(() => {
    if (context.conversationId !== conversationId && conversationId) {
       context.setConversationId(conversationId);
    }
  }, [conversationId, context]);

  const ask = async (message: string, options?: { context?: any; conversationId?: string }) => {
    if (!effectiveApiKey) {
      throw new Error("FluxChat API key is required");
    }
    // Simulation simple de l'appel réseau
    const currentConvId = options?.conversationId || conversationId || `conv-${Math.random().toString(36).substr(2, 9)}`;
    if (!conversationId) {
      setConversationId(currentConvId);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          text: `Réponse de FluxChat pour : "${message}"`,
          conversationId: currentConvId
        });
      }, 500);
    });
  };

  return {
    ask,
    conversationId,
    setConversationId
  };
}
