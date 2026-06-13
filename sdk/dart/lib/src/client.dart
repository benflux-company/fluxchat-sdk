/// FluxChat API client — entry point for the Dart/Flutter SDK.
library;

import 'package:dio/dio.dart';

import 'http_client.dart';
import 'resources/bot_resource.dart';
import 'resources/config_resource.dart';
import 'resources/knowledge_resource.dart';
import 'types.dart';

export 'errors.dart';
export 'types.dart';

/// The main FluxChat client.
///
/// Provides access to the bot (ask / testKey), knowledge-base management, and
/// per-org persona configuration through three sub-resources.
///
/// ```dart
/// final fluxchat = FluxChat(apiKey: 'fc_live_xxx');
///
/// final res = await fluxchat.ask(AskOptions(message: 'Hello!'));
/// print(res.reply);
/// ```
///
/// Authentication:
/// - [apiKey]  → public bot endpoints + knowledge writes (`bot:write` scope).
/// - [token]   → knowledge reads + persona config (JWT admin token).
/// Provide at least one.
class FluxChat {
  FluxChat({
    String? apiKey,
    String? token,
    String? baseUrl,
    String? organizationId,
    Duration timeout = const Duration(seconds: 30),
    Map<String, String>? headers,
    /// Injectable [Dio] instance — attach a custom [HttpClientAdapter] to it
    /// to intercept requests in unit tests without hitting the real API.
    Dio? dio,
  }) {
    final options = FluxChatClientOptions(
      apiKey: apiKey,
      token: token,
      baseUrl: baseUrl,
      organizationId: organizationId,
      timeout: timeout,
      headers: headers,
    );

    final internalHttp = FluxChatHttpClient(options, dio: dio);

    _bot = BotResource(internalHttp);
    knowledge = KnowledgeResource(internalHttp, organizationId);
    config = ConfigResource(internalHttp, organizationId);
  }

  late final BotResource _bot;

  /// Knowledge-base management (create / update / delete / crawl).
  late final KnowledgeResource knowledge;

  /// Persona configuration (assistant name, tone, style rules).
  late final ConfigResource config;

  // ─── Convenience shortcuts ────────────────────────────────────────────────

  /// Send a message to the assistant.
  Future<AskResponse> ask(AskOptions options) => _bot.ask(options);

  /// Verify that the configured API key is valid and return its scopes.
  Future<TestKeyResponse> testKey() => _bot.testKey();
}
