/// Internal HTTP layer for the FluxChat SDK — powered by Dio.
///
/// Uses Dio's [BaseOptions] for base URL, auth headers, and timeouts so every
/// resource class stays free of transport concerns. A [Dio] instance can be
/// injected at construction time to enable adapter-based testing without a
/// live server.
library;

import 'package:dio/dio.dart';

import 'errors.dart';
import 'types.dart';

const _defaultBaseUrl = 'https://dev-api.fluxchat-corp.com/api/v2';

/// Thin wrapper around [Dio] that centralises authentication, error mapping,
/// and unwrapping of the standard FluxChat envelope `{ success, data, timestamp }`.
class FluxChatHttpClient {
  FluxChatHttpClient(
    FluxChatClientOptions options, {
    /// Injectable [Dio] instance — set a custom [HttpClientAdapter] on it to
    /// intercept requests in unit tests without hitting the network.
    Dio? dio,
  }) {
    if (options.apiKey == null && options.token == null) {
      throw const FluxChatConfigException(
        'Missing credentials: provide apiKey or token in client options.',
      );
    }

    _dio = dio ?? Dio();

    // Overwrite options on the provided instance so auth, base URL, and
    // timeouts are always consistent. The httpClientAdapter is left untouched,
    // which is what allows test adapters to work transparently.
    _dio.options = BaseOptions(
      baseUrl: _resolveBaseUrl(options.baseUrl),
      connectTimeout: options.timeout,
      receiveTimeout: options.timeout,
      sendTimeout: options.timeout,
      // Dio sets Content-Type automatically for Map bodies; we still declare it
      // here so it appears in the headers when body is absent (e.g. GET).
      contentType: Headers.jsonContentType,
      responseType: ResponseType.json,
      headers: {
        'Accept': 'application/json',
        ...?options.headers,
        // API key takes precedence; fall back to JWT bearer.
        if (options.apiKey != null) 'X-API-Key': options.apiKey!,
        if (options.apiKey == null && options.token != null)
          'Authorization': 'Bearer ${options.token}',
      },
    );
  }

  late final Dio _dio;

  // ─── Public ──────────────────────────────────────────────────────────────

  /// Perform an authenticated request and return the unwrapped payload as [T].
  ///
  /// Throws [FluxChatApiException] on non-2xx responses and
  /// [FluxChatNetworkException] on timeout / connectivity failures.
  Future<T> request<T>({
    required String method,
    required String path,
    Object? body,
    required T Function(dynamic json) fromJson,
  }) async {
    try {
      final response = await _dio.request<dynamic>(
        path,
        data: body,
        options: Options(method: method),
      );

      return fromJson(_unwrap(response.data));
    } on DioException catch (e) {
      throw _mapDioException(e, path);
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  /// Unwraps the standard FluxChat envelope `{ success, data, timestamp }`.
  /// Falls back to returning the raw payload when the envelope is absent.
  dynamic _unwrap(dynamic data) {
    if (data is Map && data.containsKey('data') && data.containsKey('success')) {
      return data['data'];
    }
    return data;
  }

  /// Maps a [DioException] to the appropriate [FluxChatException] subtype.
  FluxChatException _mapDioException(DioException e, String path) {
    if (e.type == DioExceptionType.badResponse) {
      // The server replied with a non-2xx status — treat as an API error.
      final body = e.response?.data;
      final message =
          (body is Map && body['message'] is String)
              ? body['message'] as String
              : 'FluxChat API error ${e.response?.statusCode} on $path';

      return FluxChatApiException(
        message,
        status: e.response?.statusCode ?? 0,
        path: path,
        body: body,
      );
    }

    // Timeout variants and connectivity failures → network error.
    return FluxChatNetworkException('Network error on $path: ${e.message}');
  }

  static String _resolveBaseUrl(String? override) =>
      (override ?? _defaultBaseUrl).replaceAll(RegExp(r'/+$'), '');
}
