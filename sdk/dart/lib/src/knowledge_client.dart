import 'dart:convert';
import 'package:http/http.dart' as http;
import 'exceptions.dart';
import 'models.dart';

/// Client fluent pour les opérations Knowledge Base.
/// Accédez-y via [FluxChat.knowledge].
class KnowledgeClient {
  final _HttpHelper _http;
  final String jwtToken;

  KnowledgeClient(this._http, {required this.jwtToken});

  /// Retourne tous les éléments de la base de connaissance.
  Future<List<KnowledgeItem>> list() async {
    final data = await _http.get('/bot/knowledge', jwtToken: jwtToken) as List<dynamic>;
    return data
        .map((e) => KnowledgeItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Retourne un élément par son identifiant.
  Future<KnowledgeItem> get(String id) async {
    final data = await _http.get('/bot/knowledge/$id', jwtToken: jwtToken) as Map<String, dynamic>;
    return KnowledgeItem.fromJson(data);
  }

  /// Crée un nouvel élément de connaissance.
  Future<KnowledgeItem> create(
    String title,
    String content, {
    String? category,
    List<String>? keywords,
  }) async {
    final payload = <String, dynamic>{
      'title': title,
      'content': content,
    };
    if (category != null) payload['category'] = category;
    if (keywords != null) payload['keywords'] = keywords;

    final data = await _http.post('/bot/knowledge', payload, jwtToken: jwtToken) as Map<String, dynamic>;
    return KnowledgeItem.fromJson(data);
  }

  /// Met à jour un élément existant (mise à jour partielle).
  Future<KnowledgeItem> update(
    String id, {
    String? title,
    String? content,
    String? category,
    List<String>? keywords,
    bool? isActive,
  }) async {
    final payload = <String, dynamic>{};
    if (title != null) payload['title'] = title;
    if (content != null) payload['content'] = content;
    if (category != null) payload['category'] = category;
    if (keywords != null) payload['keywords'] = keywords;
    if (isActive != null) payload['isActive'] = isActive;

    final data = await _http.patch('/bot/knowledge/$id', payload, jwtToken: jwtToken) as Map<String, dynamic>;
    return KnowledgeItem.fromJson(data);
  }

  /// Supprime un élément par son identifiant.
  Future<void> delete(String id) async {
    await _http.delete('/bot/knowledge/$id', jwtToken: jwtToken);
  }
}

/// Helper HTTP interne partagé entre [FluxChat] et [KnowledgeClient].
class _HttpHelper {
  final String apiKey;
  final String baseUrl;
  final http.Client httpClient;

  _HttpHelper({
    required this.apiKey,
    required this.baseUrl,
    required this.httpClient,
  });

  Map<String, String> _headers(String? jwtToken) {
    final h = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (jwtToken != null) {
      h['Authorization'] = 'Bearer $jwtToken';
    } else {
      h['X-API-Key'] = apiKey;
    }
    return h;
  }

  Future<dynamic> get(String path, {String? jwtToken}) => _send('GET', path, jwtToken: jwtToken);
  
  Future<dynamic> post(String path, Map<String, dynamic> body, {String? jwtToken}) =>
      _send('POST', path, body: body, jwtToken: jwtToken);
      
  Future<void> postVoid(String path, Map<String, dynamic> body, {String? jwtToken}) async {
      await _send('POST', path, body: body, jwtToken: jwtToken, expectData: false);
  }

  Future<dynamic> patch(String path, Map<String, dynamic> body, {String? jwtToken}) =>
      _send('PATCH', path, body: body, jwtToken: jwtToken);

  Future<void> delete(String path, {String? jwtToken}) async => 
      _send('DELETE', path, jwtToken: jwtToken, expectData: false);

  Future<dynamic> _send(String method, String path,
      {Map<String, dynamic>? body, String? jwtToken, bool expectData = true}) async {
    final uri = Uri.parse('$baseUrl$path');
    http.Response response;
    final headers = _headers(jwtToken);

    try {
      switch (method) {
        case 'GET':
          response = await httpClient.get(uri, headers: headers);
          break;
        case 'POST':
          response = await httpClient.post(uri,
              headers: headers, body: jsonEncode(body));
          break;
        case 'PATCH':
          response = await httpClient.patch(uri,
              headers: headers, body: jsonEncode(body));
          break;
        case 'DELETE':
          response = await httpClient.delete(uri, headers: headers);
          break;
        default:
          throw UnsupportedError('HTTP method $method not supported');
      }
    } catch (e) {
      if (e is FluxChatApiException || e is FluxChatNetworkException) rethrow;
      throw FluxChatNetworkException('Request failed for $method $path', e);
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      String msg = response.body;
      try {
          final decoded = jsonDecode(response.body) as Map<String, dynamic>;
          if (decoded.containsKey('message') && decoded['message'] != null) {
              msg = decoded['message'].toString();
          }
      } catch (_) {}
      throw FluxChatApiException(response.statusCode, msg);
    }

    if (response.body.isEmpty || response.body == 'null') return null;
    
    final decoded = jsonDecode(response.body);
    if (decoded is Map<String, dynamic> && decoded.containsKey('success')) {
        if (expectData) {
           return decoded['data'];
        }
        return null;
    }
    
    return decoded;
  }
}
