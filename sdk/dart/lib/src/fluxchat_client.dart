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
/// // Knowledge base
/// await client.knowledge.create('FAQ', 'Contenu...');
/// ```
class FluxChat {
  late final _HttpHelper _http;
  late final KnowledgeClient knowledge;

  FluxChat({
    required String apiKey,
    String? baseUrl,
    http.Client? httpClient,
  }) {
    _http = _HttpHelper(
      apiKey: apiKey,
      baseUrl: (baseUrl ?? 'https://api.fluxchat.io/v1').replaceAll(RegExp(r'/$'), ''),
      httpClient: httpClient ?? http.Client(),
    );
    knowledge = KnowledgeClient(_http);
  }

  // ─── Core ─────────────────────────────────────────────────────────────────

  /// Envoie un message à FluxChat et retourne la réponse.
  Future<AskResponse> ask(
    String message, {
    String? context,
    String? conversationId,
  }) async {
    final payload = <String, dynamic>{'message': message};
    if (context != null) payload['context'] = context;
    if (conversationId != null) payload['conversation_id'] = conversationId;

    final data = await _http.post('/ask', payload) as Map<String, dynamic>;
    return AskResponse.fromJson(data);
  }

  /// Vérifie la clé API et retourne les informations associées.
  Future<KeyInfo> testKey() async {
    final data = await _http.get('/test-key') as Map<String, dynamic>;
    return KeyInfo.fromJson(data);
  }
}
