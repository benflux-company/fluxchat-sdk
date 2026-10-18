/**
 * Shared types for the FluxChat SDK.
 * These mirror the FluxChat public API payloads.
 */

export interface FluxChatClientOptions {
  /**
   * API key (X-API-Key). Required for the public bot endpoints and for
   * knowledge-base writes when the key carries the `bot:write` scope.
   */
  apiKey?: string;
  /**
   * JWT bearer token. Alternative to `apiKey` for admin-level operations
   * (knowledge reads, persona config). Provide one of `apiKey` or `token`.
   */
  token?: string;
  /**
   * Base URL of the FluxChat API, including the version prefix.
   * Defaults to `process.env.FLUXCHAT_BASE_URL` or the production API on **v2**
   * (`/api/v2` — required for per-request `context`).
   */
  baseUrl?: string;
  /**
   * Default organization id used by knowledge/config helpers when not passed
   * explicitly. Optional for `ask`/`testKey` (the API key already scopes the org).
   */
  organizationId?: string;
  /** Request timeout in milliseconds (default: 30000). */
  timeoutMs?: number;
  /** Custom fetch implementation (defaults to the global `fetch`). */
  fetch?: typeof fetch;
  /** Extra headers sent on every request. */
  headers?: Record<string, string>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AskOptions {
  /** The user message. */
  message: string;
  /**
   * Real-time context for THIS request only (current page, cart, user data…).
   * Treated by the bot as a priority source of truth, above the knowledge base.
   * Not used for knowledge-base search.
   */
  context?: string;
  /** Continue an existing conversation. Omit for a stateless one-off answer. */
  conversationId?: string;
  /** Opaque session id for widget persistence. */
  sessionId?: string;
}

// ─── Human handoff & support thread ───────────────────────────────────────

/** What a visitor submits when they ask for a human. */
export interface EscalateOptions {
  /** Visitor's name, as they typed it. */
  name: string;
  /** Visitor's e-mail — also what proves the resulting ticket is theirs. */
  email: string;
  /** What they want help with. Becomes the ticket's first message. */
  message: string;
  /**
   * The same opaque session id you pass to `ask()`. When present, the bot
   * conversation so far is copied into the ticket so the agent has context.
   */
  sessionId?: string;
}

export interface EscalateResponse {
  /** Id of the created ticket — keep it, with the e-mail, to follow the thread. */
  ticketId: string;
  /** Ticket status at creation (`open`, or higher on a priority-support plan). */
  status: string;
}

/** Who said a line in a ticket thread. */
export type TicketMessageRole = 'bot' | 'visitor' | 'agent';

export interface TicketMessage {
  id: string;
  content: string;
  role: TicketMessageRole;
  createdAt: string;
}

export interface TicketThread {
  ticketId: string;
  subject: string;
  /** `open` | `in_progress` | `resolved` | `closed`. */
  status: string;
  /** True once a human has actually written — not merely been assigned. */
  agentConnected: boolean;
  /** Display name of the assigned agent, when there is one. */
  agentName: string | null;
  /** `resolved` or `closed`: the visitor can read but no longer write. */
  closed: boolean;
  messages: TicketMessage[];
}

export interface TicketReplyOptions {
  ticketId: string;
  /** The e-mail the ticket was raised with. */
  email: string;
  content: string;
}

export interface AskResponse {
  /** The assistant's reply (markdown). */
  reply: string;
  /** Detected intent, if any. */
  intent: string | null;
  /** Confidence of the intent detection (0–1). */
  confidence: number;
  /** Conversation id, or "" in stateless mode. */
  conversationId: string;
  /** Result of any triggered action. */
  actionResult?: Record<string, unknown>;
  /** Model/usage metadata. */
  context: Record<string, unknown>;
}

export interface TestKeyResponse {
  message: string;
  organizationId: string;
  scopes: string[];
}

export type KnowledgeCategory =
  | 'general'
  | 'product'
  | 'pricing'
  | 'support'
  | 'contact'
  | 'policy'
  | 'custom';

export interface KnowledgeArticle {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  keywords: string[];
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeInput {
  title: string;
  content: string;
  category?: KnowledgeCategory;
  keywords?: string[];
  priority?: number;
}

export type UpdateKnowledgeInput = Partial<CreateKnowledgeInput> & {
  isActive?: boolean;
};

export interface BotConfig {
  /** Display name the assistant uses for itself. */
  assistantName?: string;
  /** Desired tone of voice. */
  tone?: string;
  /** Style rules applied to every answer. */
  styleRules?: string;
  /** Additional custom instructions injected into the system prompt. */
  customInstructions?: string;
  /** Whether bot interactions are captured as training data (default false). */
  captureTrainingData?: boolean;
}
