/// In-memory representation of a single chat turn shown in the UI.
library;

// ─── Role ─────────────────────────────────────────────────────────────────────

/// Sender side of a chat message.
enum ChatMessageRole { user, assistant }

// ─── Model ────────────────────────────────────────────────────────────────────

/// Immutable value object for one message bubble in the chat history.
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.isError = false,
  });

  /// Unique identifier — used as the Flutter list-item key.
  final String id;

  /// Whether this message was sent by the user or the assistant.
  final ChatMessageRole role;

  /// Raw text content. Assistant messages may contain Markdown.
  final String content;

  /// Wall-clock time when the message was added to the list.
  final DateTime timestamp;

  /// True when this bubble represents an in-app error notice (network failure,
  /// API error, etc.) so the UI can style it differently.
  final bool isError;
}
