/// Knowledge-base management endpoints.
///
/// Write operations (create, update, remove, crawl) require an API key with
/// the `bot:write` scope. Read operations (list, get) require a JWT token.
library;

import '../errors.dart';
import '../http_client.dart';
import '../types.dart';

/// Wraps the `/bot/organizations/:orgId/knowledge` routes.
class KnowledgeResource {
  const KnowledgeResource(this._http, this._defaultOrgId);

  final FluxChatHttpClient _http;

  /// Organization id set at client construction; can be overridden per call.
  final String? _defaultOrgId;

  // ─── Reads (JWT token required) ───────────────────────────────────────────

  /// List all knowledge articles for the organisation. Requires a JWT token.
  Future<List<KnowledgeArticle>> list({String? organizationId}) =>
      _http.request<List<KnowledgeArticle>>(
        method: 'GET',
        path: '/bot/organizations/${_orgId(organizationId)}/knowledge',
        fromJson: (json) => (json as List<dynamic>)
            .map((e) => KnowledgeArticle.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  /// Fetch a single knowledge article by [id]. Requires a JWT token.
  Future<KnowledgeArticle> get(String id, {String? organizationId}) =>
      _http.request<KnowledgeArticle>(
        method: 'GET',
        path: '/bot/organizations/${_orgId(organizationId)}/knowledge/$id',
        fromJson: (json) =>
            KnowledgeArticle.fromJson(json as Map<String, dynamic>),
      );

  // ─── Writes (bot:write scope required) ───────────────────────────────────

  /// Create a new knowledge article.
  Future<KnowledgeArticle> create(
    CreateKnowledgeInput input, {
    String? organizationId,
  }) =>
      _http.request<KnowledgeArticle>(
        method: 'POST',
        path: '/bot/organizations/${_orgId(organizationId)}/knowledge',
        body: input.toJson(),
        fromJson: (json) =>
            KnowledgeArticle.fromJson(json as Map<String, dynamic>),
      );

  /// Partially update an existing article identified by [id].
  Future<KnowledgeArticle> update(
    String id,
    UpdateKnowledgeInput input, {
    String? organizationId,
  }) =>
      _http.request<KnowledgeArticle>(
        method: 'PATCH',
        path: '/bot/organizations/${_orgId(organizationId)}/knowledge/$id',
        body: input.toJson(),
        fromJson: (json) =>
            KnowledgeArticle.fromJson(json as Map<String, dynamic>),
      );

  /// Delete the article identified by [id].
  Future<Map<String, dynamic>> remove(String id, {String? organizationId}) =>
      _http.request<Map<String, dynamic>>(
        method: 'DELETE',
        path: '/bot/organizations/${_orgId(organizationId)}/knowledge/$id',
        fromJson: (json) => json as Map<String, dynamic>,
      );

  /// Crawl a URL or sitemap and auto-populate the knowledge base (v2 only).
  Future<Map<String, dynamic>> crawl(
    String url, {
    bool isSitemap = false,
    int maxPages = 50,
    String? organizationId,
  }) =>
      _http.request<Map<String, dynamic>>(
        method: 'POST',
        path: '/bot/organizations/${_orgId(organizationId)}/knowledge/crawl',
        body: {'url': url, 'isSitemap': isSitemap, 'maxPages': maxPages},
        fromJson: (json) => json as Map<String, dynamic>,
      );

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /// Resolves the organisation id, throwing if neither explicit nor default
  /// was provided.
  String _orgId(String? explicit) {
    final id = explicit ?? _defaultOrgId;
    if (id == null || id.isEmpty) {
      throw const FluxChatConfigException(
        'organizationId is required. Pass it to the method or set it '
        'in the FluxChat client options.',
      );
    }
    return id;
  }
}
