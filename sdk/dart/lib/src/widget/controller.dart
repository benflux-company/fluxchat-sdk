/// Programmatic control surface for [FluxChatFab] and [FluxChatPage].
///
/// Extend [ChangeNotifier] so both widget modes can rebuild via [ListenableBuilder]
/// without pulling in a heavy state-management library.
library;

import 'package:flutter/foundation.dart';

import '../client.dart';
import '../types.dart';
import 'chat_message_model.dart';
import 'options.dart';

/// Controls the chat session — open/close state, message history, and API calls.
///
/// Create a controller when you need programmatic access:
/// ```dart
/// final controller = FluxChatController(options: options);
///
/// // Open the panel from an external button
/// ElevatedButton(
///   onPressed: controller.open,
///   child: Text('Chat'),
/// ),
/// FluxChatOverlay(controller: controller, child: child),
/// ```
///
/// When programmatic control is not needed the widgets create their own
/// controller internally and dispose it on unmount.
class FluxChatController extends ChangeNotifier {
  FluxChatController({
    required FluxChatOptions options,
    /// Injectable [FluxChat] client — pass a client backed by a Dio mock
    /// adapter to intercept network calls in widget tests.
    FluxChat? client,
  })  : _options = options,
        _client = client ??
            FluxChat(
              apiKey: options.apiKey,
              baseUrl: options.baseUrl,
              organizationId: options.organizationId,
              timeout: options.timeout,
              headers: options.headers,
            ) {
    // Seed the chat with the greeting so the panel is never empty on first open.
    _messages.add(ChatMessage(
      id: '0',
      role: ChatMessageRole.assistant,
      content: options.greeting,
      timestamp: DateTime.now(),
    ));
  }

  final FluxChatOptions _options;
  final FluxChat _client;

  final List<ChatMessage> _messages = [];
  String? _conversationId;
  bool _isOpen = false;
  bool _isLoading = false;

  // ─── Getters ──────────────────────────────────────────────────────────────

  /// The options this controller was created with.
  FluxChatOptions get options => _options;

  /// Unmodifiable snapshot of the current message history.
  List<ChatMessage> get messages => List.unmodifiable(_messages);

  /// Whether the chat panel / page is currently visible.
  bool get isOpen => _isOpen;

  /// Whether a reply is being awaited from the API.
  bool get isLoading => _isLoading;

  /// Convenience: true when the most recent message is a loading indicator.
  bool get hasGreeting => _messages.isNotEmpty;

  // ─── Open / close ─────────────────────────────────────────────────────────

  /// Open the chat panel (FAB mode) or navigate to the page (Page mode).
  void open() {
    _isOpen = true;
    notifyListeners();
  }

  /// Close the chat panel.
  void close() {
    _isOpen = false;
    notifyListeners();
  }

  /// Toggle open/closed.
  void toggle() {
    _isOpen = !_isOpen;
    notifyListeners();
  }

  // ─── Messaging ────────────────────────────────────────────────────────────

  /// Send [message] to the assistant and append both turns to [messages].
  ///
  /// No-op while [isLoading] is true to prevent double-sends.
  Future<void> send(String message) async {
    final trimmed = message.trim();
    if (trimmed.isEmpty || _isLoading) return;

    // Optimistically add the user turn.
    _append(ChatMessage(
      id: _nextId(),
      role: ChatMessageRole.user,
      content: trimmed,
      timestamp: DateTime.now(),
    ));

    _isLoading = true;
    notifyListeners();

    try {
      final context = _options.contextBuilder?.call();

      final response = await _client.ask(AskOptions(
        message: trimmed,
        context: context,
        conversationId: _conversationId,
      ));

      // Store the conversation id from the first reply so subsequent turns
      // are linked server-side.
      if (_conversationId == null && response.conversationId.isNotEmpty) {
        _conversationId = response.conversationId;
      }

      _options.onMessageSent?.call(trimmed);

      _append(ChatMessage(
        id: _nextId(),
        role: ChatMessageRole.assistant,
        content: response.reply,
        timestamp: DateTime.now(),
      ));

      _options.onReply?.call(response.reply);
    } catch (e) {
      _options.onError?.call(e);

      _append(ChatMessage(
        id: _nextId(),
        role: ChatMessageRole.assistant,
        content: 'Something went wrong. Please try again.',
        timestamp: DateTime.now(),
        isError: true,
      ));
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clear the conversation history and reset the server-side conversation id.
  void clearHistory() {
    _messages
      ..clear()
      ..add(ChatMessage(
        id: '0',
        role: ChatMessageRole.assistant,
        content: _options.greeting,
        timestamp: DateTime.now(),
      ));
    _conversationId = null;
    notifyListeners();
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  void _append(ChatMessage msg) => _messages.add(msg);

  /// Generates a unique id from the current timestamp.
  String _nextId() => DateTime.now().microsecondsSinceEpoch.toString();
}
