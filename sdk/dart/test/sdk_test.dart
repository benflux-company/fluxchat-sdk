/// Unit tests for the FluxChat core SDK.
///
/// Uses a custom Dio [HttpClientAdapter] to intercept HTTP calls so tests
/// run without a live API. No code generation or third-party mock library
/// is required.
library;

import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fluxchat_sdk/fluxchat_sdk.dart';

// ─── Adapter helpers ──────────────────────────────────────────────────────────

/// A Dio [HttpClientAdapter] that returns a pre-built [ResponseBody] for every
/// request, making it trivial to simulate any API response in tests.
class _StaticAdapter implements HttpClientAdapter {
  _StaticAdapter(this._body);

  final ResponseBody _body;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async =>
      _body;

  @override
  void close({bool force = false}) {}
}

/// A [HttpClientAdapter] whose behaviour is provided by a callback, allowing
/// each test to inspect the outgoing [RequestOptions].
class _CallbackAdapter implements HttpClientAdapter {
  _CallbackAdapter(this._handler);

  final Future<ResponseBody> Function(RequestOptions) _handler;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) =>
      _handler(options);

  @override
  void close({bool force = false}) {}
}

/// Builds a well-formed FluxChat envelope response body.
ResponseBody _envelope(dynamic data, {int status = 200}) =>
    ResponseBody.fromString(
      jsonEncode({'success': true, 'data': data, 'timestamp': '2024-01-01T00:00:00Z'}),
      status,
      headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
    );

/// Builds an API error response as the FluxChat backend sends it.
ResponseBody _apiError(String message, {int status = 400}) =>
    ResponseBody.fromString(
      jsonEncode({'success': false, 'message': message}),
      status,
      headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
    );

/// Creates a [FluxChat] client wired to a [_StaticAdapter] that always returns
/// [body]. Avoids boilerplate in individual tests.
FluxChat _client(ResponseBody body, {String? orgId}) {
  final dio = Dio()..httpClientAdapter = _StaticAdapter(body);
  return FluxChat(apiKey: 'fc_test_key', organizationId: orgId, dio: dio);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

void main() {
  // ── Constructor ──────────────────────────────────────────────────────────────

  group('FluxChat constructor', () {
    test('throws FluxChatConfigException when no credentials are provided', () {
      expect(
        () => FluxChat(),
        throwsA(isA<FluxChatConfigException>()),
      );
    });

    test('accepts token instead of apiKey', () {
      expect(
        () => FluxChat(token: 'jwt_token'),
        returnsNormally,
      );
    });
  });

  // ── ask() ────────────────────────────────────────────────────────────────────

  group('FluxChat.ask()', () {
    test('returns a parsed AskResponse on success', () async {
      final client = _client(_envelope({
        'reply': 'Hello from the bot!',
        'intent': 'greeting',
        'confidence': 0.95,
        'conversationId': 'conv-123',
        'context': {},
      }));

      final res = await client.ask(const AskOptions(message: 'Hello'));

      expect(res.reply, 'Hello from the bot!');
      expect(res.intent, 'greeting');
      expect(res.confidence, 0.95);
      expect(res.conversationId, 'conv-123');
    });

    test('forwards context field when provided', () async {
      RequestOptions? captured;

      final dio = Dio()
        ..httpClientAdapter = _CallbackAdapter((opts) async {
          captured = opts;
          return _envelope({
            'reply': 'Context received.',
            'intent': null,
            'confidence': 0.0,
            'conversationId': '',
            'context': {},
          });
        });

      final client = FluxChat(apiKey: 'fc_test_key', dio: dio);

      await client.ask(const AskOptions(
        message: 'What plan suits me?',
        context: 'User is on the pricing page.',
      ));

      expect(captured, isNotNull);
      final body = captured!.data as Map<String, dynamic>;
      expect(body['context'], 'User is on the pricing page.');
    });

    test('throws FluxChatApiException with status on non-2xx', () async {
      final client = _client(_apiError('Unauthorised', status: 401));

      expect(
        () => client.ask(const AskOptions(message: 'hi')),
        throwsA(
          isA<FluxChatApiException>().having((e) => e.status, 'status', 401),
        ),
      );
    });

    test('includes the request path in FluxChatApiException', () async {
      final client = _client(_apiError('Forbidden', status: 403));

      try {
        await client.ask(const AskOptions(message: 'hi'));
        fail('should have thrown');
      } on FluxChatApiException catch (e) {
        expect(e.path, '/public/bot/ask');
        expect(e.message, 'Forbidden');
      }
    });
  });

  // ── testKey() ────────────────────────────────────────────────────────────────

  group('FluxChat.testKey()', () {
    test('returns parsed TestKeyResponse', () async {
      final client = _client(_envelope({
        'message': 'Key is valid',
        'organizationId': 'org-abc',
        'scopes': ['bot:write'],
      }));

      final res = await client.testKey();

      expect(res.organizationId, 'org-abc');
      expect(res.scopes, contains('bot:write'));
    });
  });

  // ── Knowledge ────────────────────────────────────────────────────────────────

  group('FluxChat.knowledge', () {
    test('create() returns a parsed KnowledgeArticle', () async {
      final client = _client(
        _envelope({
          'id': 'ka-1',
          'organizationId': 'org-abc',
          'title': 'FAQ',
          'content': 'Answers here.',
          'category': 'support',
          'keywords': ['faq'],
          'priority': 0,
          'isActive': true,
          'createdAt': '2024-01-01T00:00:00Z',
          'updatedAt': '2024-01-01T00:00:00Z',
        }),
        orgId: 'org-abc',
      );

      final article = await client.knowledge.create(
        const CreateKnowledgeInput(title: 'FAQ', content: 'Answers here.'),
      );

      expect(article.id, 'ka-1');
      expect(article.title, 'FAQ');
      expect(article.category, KnowledgeCategory.support);
    });

    test('throws FluxChatConfigException when organizationId is missing', () {
      // No orgId in either the client or the method call.
      final dio = Dio()..httpClientAdapter = _StaticAdapter(_envelope({}));
      final noOrgClient = FluxChat(apiKey: 'fc_test_key', dio: dio);

      expect(
        () => noOrgClient.knowledge.create(
          const CreateKnowledgeInput(title: 'x', content: 'y'),
        ),
        throwsA(isA<FluxChatConfigException>()),
      );
    });

    test('remove() returns a message map', () async {
      final client = _client(_envelope({'message': 'deleted'}), orgId: 'org-abc');
      final result = await client.knowledge.remove('ka-1');
      expect(result['message'], 'deleted');
    });
  });

  // ── Network error ─────────────────────────────────────────────────────────────

  group('FluxChatNetworkException', () {
    test('is thrown when Dio encounters a connection error', () async {
      final dio = Dio()
        ..httpClientAdapter = _CallbackAdapter((_) async {
          throw DioException(
            requestOptions: RequestOptions(path: '/public/bot/ask'),
            type: DioExceptionType.connectionError,
            message: 'Connection refused',
          );
        });

      final client = FluxChat(apiKey: 'fc_test_key', dio: dio);

      expect(
        () => client.ask(const AskOptions(message: 'hi')),
        throwsA(isA<FluxChatNetworkException>()),
      );
    });
  });
}
