import { useState, useContext, useEffect, useMemo } from 'react';
import { FluxChatContext } from './fluxchatContext';
import { FluxChatClient, AskOptions } from './client';

export function useFluxChat(apiKey?: string, baseUrl?: string) {
  const context = useContext(FluxChatContext);
  const effectiveApiKey = apiKey || context.apiKey;
  const [conversationId, setConversationId] = useState<string | undefined>(context.conversationId);
  const [sessionId, setSessionId] = useState<string | undefined>();

  // Sync context
  useEffect(() => {
    if (context.conversationId !== conversationId && conversationId) {
       context.setConversationId(conversationId);
    }
  }, [conversationId, context]);

  const client = useMemo(() => {
    if (!effectiveApiKey) return null;
    return new FluxChatClient({ apiKey: effectiveApiKey, baseUrl });
  }, [effectiveApiKey, baseUrl]);

  const ask = async (message: string, options?: AskOptions) => {
    if (!client) {
      throw new Error("FluxChat API key is required. Wrap your app in FluxChatContext or pass apiKey to useFluxChat.");
    }
    
    const requestOptions: AskOptions = {
      context: options?.context,
      conversationId: options?.conversationId || conversationId,
      sessionId: options?.sessionId || sessionId,
    };

    const response = await client.ask(message, requestOptions);
    
    if (response.conversationId && !conversationId) {
      setConversationId(response.conversationId);
    }

    return response;
  };

  const capturePage = async (url: string, title: string, content: string) => {
    if (!client) throw new Error("FluxChat API key is required.");
    return client.capturePage(url, title, content);
  };

  return {
    ask,
    capturePage,
    conversationId,
    setConversationId,
    sessionId,
    setSessionId,
    client
  };
}
