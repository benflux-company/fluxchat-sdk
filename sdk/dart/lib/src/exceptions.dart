/// Exception levée lorsque l'API FluxChat retourne une erreur HTTP.
class FluxChatApiException implements Exception {
  final int statusCode;
  final String apiMessage;

  const FluxChatApiException(this.statusCode, [this.apiMessage = '']);

  @override
  String toString() =>
      'FluxChatApiException: HTTP $statusCode — $apiMessage';
}

/// Exception levée lors d'une erreur réseau (timeout, connexion refusée, etc.).
class FluxChatNetworkException implements Exception {
  final String message;
  final Object? cause;

  const FluxChatNetworkException(this.message, [this.cause]);

  @override
  String toString() => 'FluxChatNetworkException: $message'
      '${cause != null ? ' (caused by: $cause)' : ''}';
}
