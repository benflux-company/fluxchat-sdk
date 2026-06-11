import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:test/test.dart';
import 'package:fluxchat/fluxchat.dart';

// ─── Helper : crée un client avec réponse mockée ──────────────────────────────

FluxChat buildMockClient(int status, Object responseBody) {
  final mockClient = MockClient((request) async {
    return http.Response(jsonEncode(responseBody), status,
        headers: {'content-type': 'application/json'});
  });
  return FluxChat(apiKey: 'test-key', httpClient: mockClient);
}

void main() {
  // ─── ask() ──────────────────────────────────────────────────────────────────

  group('ask()', () {
    test('retourne une AskResponse valide', () async {
      final client = buildMockClient(200, {
        'text': 'Bonjour !',
        'conversation_id': 'conv-1',
      });

      final result = await client.ask('Bonjour');

      expect(result.reply, equals('Bonjour !'));
      expect(result.conversationId, equals('conv-1'));
    });

    test('accepte context et conversationId', () async {
      final client = buildMockClient(200, {
        'text': 'Réponse',
        'conversation_id': 'conv-abc',
      });

      final result = await client.ask(
        'Question',
        context: 'support',
        conversationId: 'conv-abc',
      );

      expect(result.conversationId, equals('conv-abc'));
    });

    test('lève FluxChatApiException sur erreur 401', () async {
      final client = buildMockClient(401, {'error': 'Invalid key'});

      expect(
        () => client.ask('test'),
        throwsA(isA<FluxChatApiException>()
            .having((e) => e.statusCode, 'statusCode', 401)),
      );
    });
  });

  // ─── testKey() ──────────────────────────────────────────────────────────────

  group('testKey()', () {
    test('retourne KeyInfo valide', () async {
      final client = buildMockClient(200, {
        'organization_id': 'org-123',
        'scopes': ['read', 'write'],
      });

      final info = await client.testKey();

      expect(info.organizationId, equals('org-123'));
      expect(info.scopes, containsAll(['read', 'write']));
    });

    test('lève FluxChatApiException sur erreur 403', () async {
      final client = buildMockClient(403, {'error': 'Forbidden'});

      expect(
        () => client.testKey(),
        throwsA(isA<FluxChatApiException>()),
      );
    });
  });

  // ─── knowledge ──────────────────────────────────────────────────────────────

  group('knowledge.list()', () {
    test('retourne une liste de KnowledgeItem', () async {
      final client = buildMockClient(200, [
        {'id': '1', 'title': 'FAQ', 'content': 'Contenu'}
      ]);

      final items = await client.knowledge.list();

      expect(items.length, equals(1));
      expect(items.first.title, equals('FAQ'));
    });
  });

  group('knowledge.create()', () {
    test('retourne le KnowledgeItem créé', () async {
      final client = buildMockClient(200, {
        'id': '2',
        'title': 'Nouveau',
        'content': 'Mon contenu',
      });

      final item = await client.knowledge.create('Nouveau', 'Mon contenu');

      expect(item.id, equals('2'));
      expect(item.title, equals('Nouveau'));
    });
  });

  group('knowledge.delete()', () {
    test('ne lève pas d\'exception sur succès', () async {
      final client = buildMockClient(204, '');

      await expectLater(client.knowledge.delete('1'), completes);
    });
  });

  // ─── Exceptions ─────────────────────────────────────────────────────────────

  group('FluxChatApiException', () {
    test('toString contient le statusCode', () {
      final e = FluxChatApiException(404, 'Not found');
      expect(e.toString(), contains('404'));
    });
  });

  group('FluxChatNetworkException', () {
    test('toString contient le message', () {
      final e = FluxChatNetworkException('Connection refused');
      expect(e.toString(), contains('Connection refused'));
    });
  });
}
