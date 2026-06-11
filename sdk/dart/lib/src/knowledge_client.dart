import 'dart:convert';
import 'package:http/http.dart' as http;
import 'exceptions.dart';
import 'models.dart';

/// Client fluent pour les opérations Knowledge Base.
/// Accédez-y via [FluxChatClient.knowledge].
class KnowledgeClient {
  final _HttpHelper _http;

  KnowledgeClient(this._http);

  /// Retourne tous les éléments de la base de connaissance.
  Future<List<KnowledgeItem>> list() async {
    final data = await _http.get('/knowledge') as List<dynamic>;
    return data
        .map((e) => KnowledgeItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Retourne un élément par son identifiant.
  Future<KnowledgeItem> get(String id) async {
    final data = await _http.get('/knowledge/$id') as Map<String, dynamic>;
    return KnowledgeItem.fromJson(data);
  }

  /// Crée un nouvel élément de connaissance.
  Future<KnowledgeItem> create(String title, String content) async {
    final data = await _http.post('/knowledge', {
      'title': title,
      'content': content,
    }) as Map<String, dynamic>;
    return KnowledgeItem.fromJson(data);
  }

  /// Met à jour un élément existant.
  Future<KnowledgeItem> update(String id, String title, String content) async {
    final data = await _http.put('/knowledge/$id', {
      'title': title,
      'content': content,
    }) as Map<String, dynamic>;
    return KnowledgeItem.fromJson(data);
  }

  /// Supprime un élément par son identifiant.
  Future<void> delete(String id) async {
    await _http.delete('/knowledge/$id');
  }
}

/// Helper HTTP interne partagé entre [FluxChatClient] et [KnowledgeClient].
class _HttpHelper {
  final String apiKey;
  final String baseUrl;
  final http.Client httpClient;

  _HttpHelper({
    required this.apiKey,
    required this.baseUrl,
    required this.httpClient,
  });

  Map<String, String> get _headers => {
        'Authorization': 'Bearer $apiKey',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  Future<dynamic> get(String path) => _send('GET', path);
  Future<dynamic> post(String path, Map<String, dynamic> body) =>
      _send('POST', path, body: body);
  Future<dynamic> put(String path, Map<String, dynamic> body) =>
      _send('PUT', path, body: body);
  Future<void> delete(String path) async => _send('DELETE', path);

  Future<dynamic> _send(String method, String path,
      {Map<String, dynamic>? body}) async {
    final uri = Uri.parse('$baseUrl$path');
    http.Response response;

    try {
      switch (method) {
        case 'GET':
          response = await httpClient.get(uri, headers: _headers);
          break;
        case 'POST':
          response = await httpClient.post(uri,
              headers: _headers, body: jsonEncode(body));
          break;
        case 'PUT':
          response = await httpClient.put(uri,
              headers: _headers, body: jsonEncode(body));
          break;
        case 'DELETE':
          response = await httpClient.delete(uri, headers: _headers);
          break;
        default:
          throw UnsupportedError('HTTP method $method not supported');
      }
    } catch (e) {
      if (e is FluxChatApiException || e is FluxChatNetworkException) rethrow;
      throw FluxChatNetworkException('Request failed for $method $path', e);
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw FluxChatApiException(response.statusCode, response.body);
    }

    if (response.body.isEmpty || response.body == 'null') return null;
    return jsonDecode(response.body);
  }
}
