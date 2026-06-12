import 'package:http/http.dart' as http;
import 'exceptions.dart';
import 'knowledge_client.dart';
import 'models.dart';

/// Client principal FluxChat pour Dart et Flutter.
///
/// ```dart
/// final client = FluxChat(apiKey: 'sk-...');
///
/// // Envoyer un message
/// final result = await client.ask('Bonjour !');
/// print(result.reply);
///
/// // Capturer une page
/// await client.capturePage(url: 'https://...', title: 'FAQ', content: '...');
///
/// // Knowledge base (requiert un JWT)
/// final kb = client.knowledge(jwtToken: 'eyJhbGci...');
/// await kb.create('FAQ', 'Contenu...');
/// ```
class FluxChat {
  late final _HttpHelper _http;

  FluxChat({
    required String apiKey,
    String? baseUrl,
    http.Client? httpClient,
  }) {
    _http = _HttpHelper(
      apiKey: apiKey,
      baseUrl: (baseUrl ?? 'https://dev-api.fluxchat-corp.com/api/v2')
          .replaceAll(RegExp(r'/$'), ''),
      httpClient: httpClient ?? http.Client(),
    );
  }

  // ─── Core ─────────────────────────────────────────────────────────────────

  /// Envoie un message à FluxChat et retourne la réponse.
  ///
  /// [sessionId] permet de maintenir le contexte entre plusieurs appels.
  Future<AskResponse> ask(
    String message, {
    String? context,
    String? conversationId,
    String? sessionId,
  }) async {
    final payload = <String, dynamic>{'message': message};
    if (context != null) payload['context'] = context;
    if (conversationId != null) payload['conversationId'] = conversationId;
    if (sessionId != null) payload['sessionId'] = sessionId;

    final data = await _http.post('/public/bot/ask', payload);
    return AskResponse.fromJson(data as Map<String, dynamic>);
  }

  /// Vérifie la clé API et retourne les informations associées.
  Future<KeyInfo> testKey() async {
    final data = await _http.get('/public/bot/test');
    return KeyInfo.fromJson(data as Map<String, dynamic>);
  }

  /// Capture passivement le contenu d'une page pour la base de connaissance.
  Future<void> capturePage({
    required String url,
    required String title,
    required String content,
  }) async {
    await _http.postVoid('/public/bot/pages', {
      'url': url,
      'title': title,
      'content': content,
    });
  }

  // ─── Knowledge ────────────────────────────────────────────────────────────

  /// Retourne un client pour les opérations CRUD Knowledge Base.
  /// [jwtToken] est requis pour toutes les opérations d'administration.
  KnowledgeClient knowledge({required String jwtToken}) {
    return KnowledgeClient(_http, jwtToken: jwtToken);
  }
}
