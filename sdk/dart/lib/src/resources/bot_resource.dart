/// Public bot endpoints — API-key authentication only.
library;

import '../http_client.dart';
import '../types.dart';

/// Wraps the `/public/bot` routes exposed without admin credentials.
class BotResource {
  const BotResource(this._http);

  final FluxChatHttpClient _http;

  /// Send a user message to the assistant and receive a reply.
  ///
  /// Pass [AskOptions.context] to inject real-time data the bot must treat as a
  /// priority source of truth (above the knowledge base).
  /// Omit [AskOptions.conversationId] for a stateless one-off answer — nothing
  /// is persisted server-side and [AskResponse.conversationId] will be empty.
  Future<AskResponse> ask(AskOptions options) =>
      _http.request<AskResponse>(
        method: 'POST',
        path: '/public/bot/ask',
        body: options.toJson(),
        fromJson: (json) => AskResponse.fromJson(json as Map<String, dynamic>),
      );

  /// Verify that the configured API key is valid and return its granted scopes.
  Future<TestKeyResponse> testKey() =>
      _http.request<TestKeyResponse>(
        method: 'GET',
        path: '/public/bot/test',
        fromJson: (json) =>
            TestKeyResponse.fromJson(json as Map<String, dynamic>),
      );
}
