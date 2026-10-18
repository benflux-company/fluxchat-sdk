/// Human handoff and the visitor's own support thread — API-key auth only.
library;

import '../http_client.dart';
import '../types.dart';

/// Wraps the public handoff routes.
///
/// The visitor has no FluxChat account and no session: the e-mail they
/// escalated with is what proves the ticket is theirs, on every read and every
/// reply. Treat it like a one-time link you e-mailed them — enough to reach
/// their own conversation, never anyone else's, since the lookup is also
/// scoped to the organization behind the API key.
///
/// The thread is polled, not pushed: there is no socket on the public surface.
/// Five seconds is the cadence the official widget uses and what the route's
/// rate limit is sized for.
class SupportResource {
  const SupportResource(this._http);

  final FluxChatHttpClient _http;

  /// Hand a visitor off to a human — creates a real support ticket.
  ///
  /// Pass the same [EscalateOptions.sessionId] you use with `ask` and
  /// everything the bot already said is copied into the ticket, so the agent
  /// picks up mid-conversation. Best-effort: the session lives for 2h.
  Future<EscalateResponse> escalate(EscalateOptions options) =>
      _http.request<EscalateResponse>(
        method: 'POST',
        path: '/public/bot/escalate',
        body: options.toJson(),
        fromJson: (json) =>
            EscalateResponse.fromJson(json as Map<String, dynamic>),
      );

  /// Read a visitor's own ticket thread, each line labelled by role.
  ///
  /// Throws a 404 both when the ticket does not exist and when [email] is not
  /// the one it was raised with: the two cases are deliberately
  /// indistinguishable, so a guessed ticket id reveals nothing.
  Future<TicketThread> thread(String ticketId, String email) =>
      _http.request<TicketThread>(
        method: 'GET',
        path: '/public/bot/tickets/${Uri.encodeComponent(ticketId)}'
            '?email=${Uri.encodeComponent(email)}',
        fromJson: (json) => TicketThread.fromJson(json as Map<String, dynamic>),
      );

  /// Post the visitor's reply into their own ticket.
  ///
  /// A reply to a `resolved` ticket reopens it; a `closed` one refuses the
  /// write (403) rather than swallowing a message nobody will read.
  Future<void> reply({
    required String ticketId,
    required String email,
    required String content,
  }) =>
      _http.request<void>(
        method: 'POST',
        path: '/public/bot/tickets/${Uri.encodeComponent(ticketId)}/messages',
        body: {'email': email, 'content': content},
        fromJson: (_) {},
      );
}
