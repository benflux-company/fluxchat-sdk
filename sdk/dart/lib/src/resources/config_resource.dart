/// Per-organisation bot persona configuration endpoints.
///
/// [get] requires org membership; [update] requires a JWT admin token.
library;

import '../errors.dart';
import '../http_client.dart';
import '../types.dart';

/// Wraps the `/bot/organizations/:orgId/config` routes.
class ConfigResource {
  const ConfigResource(this._http, this._defaultOrgId);

  final FluxChatHttpClient _http;
  final String? _defaultOrgId;

  /// Read the current persona config for the organisation.
  Future<BotConfig> get({String? organizationId}) =>
      _http.request<BotConfig>(
        method: 'GET',
        path: '/bot/organizations/${_orgId(organizationId)}/config',
        fromJson: (json) => BotConfig.fromJson(json as Map<String, dynamic>),
      );

  /// Apply a partial update to the persona config (name, tone, style rules…).
  Future<BotConfig> update(BotConfig patch, {String? organizationId}) =>
      _http.request<BotConfig>(
        method: 'PATCH',
        path: '/bot/organizations/${_orgId(organizationId)}/config',
        body: patch.toJson(),
        fromJson: (json) => BotConfig.fromJson(json as Map<String, dynamic>),
      );

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
