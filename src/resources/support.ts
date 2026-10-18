import type { HttpClient } from '../http.js';
import type {
  EscalateOptions,
  EscalateResponse,
  TicketReplyOptions,
  TicketThread,
} from '../types.js';

/**
 * Human handoff and the visitor's own support thread (API-key auth).
 *
 * The visitor has no FluxChat account and no session: the e-mail they
 * escalated with is what proves the ticket is theirs, on every read and every
 * reply. Treat it like a one-time link you e-mailed them — enough to reach
 * their own conversation, never enough to reach anyone else's, since the
 * lookup is also scoped to the organization behind the API key.
 *
 * The thread is polled, not pushed: there is no socket on the public surface.
 * Five seconds is the cadence the official widget uses and what the route's
 * rate limit is sized for.
 */
export class SupportResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Hand a visitor off to a human. Creates a real support ticket in the
   * organization's dashboard, auto-assigned to its least busy agent.
   *
   * Pass the same `sessionId` you used with `ask()` and everything the bot
   * already said is copied into the ticket, so the agent picks up
   * mid-conversation instead of reading one decontextualised sentence.
   * Best-effort: the session lives for 2h, after which the ticket simply
   * starts at the visitor's message.
   */
  escalate(options: EscalateOptions): Promise<EscalateResponse> {
    return this.http.request<EscalateResponse>({
      method: 'POST',
      path: '/public/bot/escalate',
      body: {
        name: options.name,
        email: options.email,
        message: options.message,
        sessionId: options.sessionId,
      },
    });
  }

  /**
   * Read a visitor's own ticket thread — their messages, the bot's, and the
   * agent's, each labelled by `role`.
   *
   * Throws `FluxChatApiError` with status 404 both when the ticket does not
   * exist and when `email` is not the one it was raised with: the two cases
   * are deliberately indistinguishable, so a guessed ticket id tells an
   * attacker nothing.
   */
  thread(ticketId: string, email: string): Promise<TicketThread> {
    return this.http.request<TicketThread>({
      method: 'GET',
      path: `/public/bot/tickets/${encodeURIComponent(ticketId)}?email=${encodeURIComponent(email)}`,
    });
  }

  /**
   * Post the visitor's reply into their own ticket.
   *
   * A reply to a ticket an agent already marked `resolved` reopens it; a
   * `closed` ticket refuses the write (403) rather than swallowing a message
   * nobody will read.
   */
  reply(options: TicketReplyOptions): Promise<void> {
    return this.http.request<void>({
      method: 'POST',
      path: `/public/bot/tickets/${encodeURIComponent(options.ticketId)}/messages`,
      body: {
        email: options.email,
        content: options.content,
      },
    });
  }
}
