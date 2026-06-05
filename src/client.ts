import { HttpClient } from './http.js';
import { BotResource } from './resources/bot.js';
import { KnowledgeResource } from './resources/knowledge.js';
import { ConfigResource } from './resources/config.js';
import type {
  AskOptions,
  AskResponse,
  FluxChatClientOptions,
  TestKeyResponse,
} from './types.js';

/**
 * FluxChat API client.
 *
 * @example
 * ```ts
 * import { FluxChat } from '@fluxchat/sdk';
 *
 * const fluxchat = new FluxChat({ apiKey: process.env.FLUXCHAT_API_KEY });
 *
 * const { reply } = await fluxchat.ask({
 *   message: 'Quel est le statut de ma commande ?',
 *   context: 'Commande #1234 — expédiée le 3 juin, livraison prévue le 6 juin.',
 * });
 * ```
 */
export class FluxChat {
  /** Knowledge-base management (create/update/delete with `bot:write`). */
  readonly knowledge: KnowledgeResource;
  /** Per-org persona configuration (requires admin auth). */
  readonly config: ConfigResource;

  private readonly bot: BotResource;

  constructor(options: FluxChatClientOptions) {
    const http = new HttpClient(options);
    this.bot = new BotResource(http);
    this.knowledge = new KnowledgeResource(http, options.organizationId);
    this.config = new ConfigResource(http, options.organizationId);
  }

  /**
   * Send a message to the assistant. Shortcut for the bot resource.
   * @see AskOptions
   */
  ask(options: AskOptions): Promise<AskResponse> {
    return this.bot.ask(options);
  }

  /** Verify the configured API key and return its scopes. */
  testKey(): Promise<TestKeyResponse> {
    return this.bot.testKey();
  }
}
