import type { HttpClient } from '../http.js';
import type { AskOptions, AskResponse, TestKeyResponse } from '../types.js';

/**
 * Public bot endpoints (API-key auth).
 */
export class BotResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Send a message to the assistant.
   *
   * Pass `context` to inject real-time data the bot must treat as a priority
   * source of truth (above the knowledge base). Omit `conversationId` for a
   * stateless one-off answer (nothing is persisted server-side).
   */
  ask(options: AskOptions): Promise<AskResponse> {
    return this.http.request<AskResponse>({
      method: 'POST',
      path: '/public/bot/ask',
      body: {
        message: options.message,
        context: options.context,
        conversationId: options.conversationId,
        sessionId: options.sessionId,
      },
    });
  }

  /**
   * Verify that the configured API key is valid and return its scopes.
   */
  testKey(): Promise<TestKeyResponse> {
    return this.http.request<TestKeyResponse>({
      method: 'GET',
      path: '/public/bot/test',
    });
  }
}
