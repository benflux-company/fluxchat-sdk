/// Exception hierarchy for the FluxChat SDK.
///
/// Every failure thrown by this library is a subtype of [FluxChatException],
/// so callers can catch the base type when they don't need to discriminate.
library;

// ─── Base ────────────────────────────────────────────────────────────────────

/// Root exception for all FluxChat SDK failures.
class FluxChatException implements Exception {
  const FluxChatException(this.message);

  final String message;

  @override
  String toString() => 'FluxChatException: $message';
}

// ─── Subtypes ─────────────────────────────────────────────────────────────────

/// Thrown when the client is mis-configured (missing credentials, missing
/// [organizationId], unsupported runtime, etc.).
class FluxChatConfigException extends FluxChatException {
  const FluxChatConfigException(super.message);

  @override
  String toString() => 'FluxChatConfigException: $message';
}

/// Thrown when the FluxChat API responds with a non-2xx HTTP status.
class FluxChatApiException extends FluxChatException {
  const FluxChatApiException(
    super.message, {
    required this.status,
    required this.path,
    this.body,
  });

  /// HTTP status code returned by the API.
  final int status;

  /// Request path that triggered the error (e.g. `/public/bot/ask`).
  final String path;

  /// Raw response body when available (decoded JSON or plain text).
  final Object? body;

  @override
  String toString() =>
      'FluxChatApiException[$status] on $path: $message';
}

/// Thrown when a request times out or the network is unreachable.
class FluxChatNetworkException extends FluxChatException {
  const FluxChatNetworkException(super.message);

  @override
  String toString() => 'FluxChatNetworkException: $message';
}
