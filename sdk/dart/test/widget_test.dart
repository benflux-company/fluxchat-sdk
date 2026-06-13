/// Widget tests for FluxChatPage and FluxChatFab.
///
/// HTTP is intercepted via a Dio [HttpClientAdapter] injected through
/// [FluxChatController]'s optional [client] parameter. No live API needed.
library;

import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fluxchat_sdk/widget.dart';

// ─── Adapter helpers ──────────────────────────────────────────────────────────

/// Returns the same [ResponseBody] for every request.
class _StaticAdapter implements HttpClientAdapter {
  _StaticAdapter(this._body);
  final ResponseBody _body;

  @override
  Future<ResponseBody> fetch(RequestOptions o, Stream<Uint8List>? rs, Future<void>? cf) async => _body;
  @override
  void close({bool force = false}) {}
}

ResponseBody _replyBody(String reply) => ResponseBody.fromString(
      jsonEncode({
        'success': true,
        'data': {
          'reply': reply,
          'intent': null,
          'confidence': 0.0,
          'conversationId': 'conv-1',
          'context': {},
        },
        'timestamp': '2024-01-01T00:00:00Z',
      }),
      200,
      headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
    );

/// Creates a [FluxChat] client backed by a static mock adapter.
FluxChat _fakeClient(String reply) {
  final dio = Dio()..httpClientAdapter = _StaticAdapter(_replyBody(reply));
  return FluxChat(apiKey: 'fc_test_key', dio: dio);
}

// ─── Test helpers ─────────────────────────────────────────────────────────────

/// Minimal [FluxChatOptions] — points at nothing, HTTP is mocked.
const _opts = FluxChatOptions(
  apiKey: 'fc_test_key',
  assistantName: 'TestBot',
  greeting: 'Hi, I am TestBot.',
  placeholder: 'Type here…',
);

/// Wraps [child] in a minimal Material 3 app.
Widget _app(Widget child) => MaterialApp(
      theme: ThemeData(useMaterial3: true),
      home: child,
    );

// ─── FluxChatPage ─────────────────────────────────────────────────────────────

void main() {
  group('FluxChatPage', () {
    testWidgets('shows greeting on open', (tester) async {
      final ctrl = FluxChatController(
        options: _opts,
        client: _fakeClient('irrelevant'),
      );

      await tester.pumpWidget(_app(FluxChatPage(options: _opts, controller: ctrl)));
      await tester.pump();

      expect(find.text('Hi, I am TestBot.'), findsOneWidget);
      ctrl.dispose();
    });

    testWidgets('AppBar displays assistantName', (tester) async {
      final ctrl = FluxChatController(options: _opts, client: _fakeClient(''));
      await tester.pumpWidget(_app(FluxChatPage(options: _opts, controller: ctrl)));
      await tester.pump();

      // The name appears in the AppBar title column.
      expect(find.text('TestBot'), findsWidgets);
      ctrl.dispose();
    });

    testWidgets('sends a message and renders the bot reply', (tester) async {
      final ctrl = FluxChatController(
        options: _opts,
        client: _fakeClient('Hello from TestBot!'),
      );

      await tester.pumpWidget(_app(FluxChatPage(options: _opts, controller: ctrl)));
      await tester.pump();

      // Type and submit.
      await tester.enterText(find.byType(TextField), 'Hello');
      await tester.tap(find.byType(FilledButton).last);
      await tester.pump(); // user bubble appears

      expect(find.text('Hello'), findsOneWidget);

      await tester.pumpAndSettle(); // wait for async reply

      expect(find.textContaining('Hello from TestBot!'), findsOneWidget);
      ctrl.dispose();
    });

    testWidgets('clear-history resets to greeting after confirmation', (tester) async {
      final ctrl = FluxChatController(options: _opts, client: _fakeClient(''));
      await tester.pumpWidget(_app(FluxChatPage(options: _opts, controller: ctrl)));
      await tester.pump();

      // Tap the refresh icon in the AppBar.
      await tester.tap(find.byIcon(Icons.refresh_rounded));
      await tester.pumpAndSettle();

      expect(find.text('Clear conversation?'), findsOneWidget);

      // Confirm.
      await tester.tap(find.widgetWithText(FilledButton, 'Clear'));
      await tester.pumpAndSettle();

      // Greeting should be the only message.
      expect(find.text('Hi, I am TestBot.'), findsOneWidget);
      ctrl.dispose();
    });
  });

  // ── FluxChatController ────────────────────────────────────────────────────────

  group('FluxChatController', () {
    test('starts with the greeting as the only message', () {
      final ctrl = FluxChatController(options: _opts, client: _fakeClient(''));
      expect(ctrl.messages.length, 1);
      expect(ctrl.messages.first.role, ChatMessageRole.assistant);
      expect(ctrl.messages.first.content, 'Hi, I am TestBot.');
      ctrl.dispose();
    });

    test('open / close / toggle update isOpen correctly', () {
      final ctrl = FluxChatController(options: _opts, client: _fakeClient(''));
      expect(ctrl.isOpen, false);

      ctrl.open();
      expect(ctrl.isOpen, true);

      ctrl.close();
      expect(ctrl.isOpen, false);

      ctrl.toggle();
      expect(ctrl.isOpen, true);
      ctrl.dispose();
    });

    test('clearHistory resets messages to the greeting', () {
      final ctrl = FluxChatController(options: _opts, client: _fakeClient(''));
      ctrl.clearHistory();
      expect(ctrl.messages.length, 1);
      expect(ctrl.messages.first.role, ChatMessageRole.assistant);
      ctrl.dispose();
    });

    test('options getter returns the original options', () {
      final ctrl = FluxChatController(options: _opts, client: _fakeClient(''));
      expect(ctrl.options.apiKey, 'fc_test_key');
      expect(ctrl.options.assistantName, 'TestBot');
      ctrl.dispose();
    });
  });

  // ── FluxChatFab ───────────────────────────────────────────────────────────────

  group('FluxChatFab', () {
    testWidgets('renders a FloatingActionButton', (tester) async {
      await tester.pumpWidget(_app(Stack(
        children: [
          const Scaffold(),
          FluxChatFab(
            options: _opts,
            controller: FluxChatController(options: _opts, client: _fakeClient('')),
          ),
        ],
      )));
      await tester.pump();

      expect(find.byType(FloatingActionButton), findsOneWidget);
    });

    testWidgets('tapping FAB makes the greeting visible', (tester) async {
      final ctrl = FluxChatController(options: _opts, client: _fakeClient(''));

      await tester.pumpWidget(_app(Stack(
        children: [
          const Scaffold(),
          FluxChatFab(options: _opts, controller: ctrl),
        ],
      )));
      await tester.pump();

      // Panel hidden — greeting not rendered yet.
      expect(find.text('Hi, I am TestBot.'), findsNothing);

      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();

      expect(find.text('Hi, I am TestBot.'), findsOneWidget);
      ctrl.dispose();
    });
  });
}
