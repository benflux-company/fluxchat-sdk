/// Configuration shared by [FluxChatFab], [FluxChatOverlay], and [FluxChatPage].
library;

import 'package:flutter/material.dart';

// ─── Enumerations ─────────────────────────────────────────────────────────────

/// Corner where the floating action button appears.
enum FabPosition {
  bottomRight,
  bottomLeft,
  topRight,
  topLeft,
}

/// Color-scheme preference for the chat UI.
///
/// [system] follows the device setting and reacts to live changes.
enum FluxChatThemeMode {
  light,
  dark,
  system,
}

// ─── Options class ────────────────────────────────────────────────────────────

/// All configuration options accepted by the FluxChat widgets.
///
/// Separating options from widget state keeps the API surface clean and makes
/// it easy to share the same config between [FluxChatFab] and [FluxChatPage].
class FluxChatOptions {
  const FluxChatOptions({
    required this.apiKey,
    this.baseUrl,
    this.organizationId,
    this.timeout = const Duration(seconds: 30),
    this.headers,
    // UI
    this.assistantName = 'Assistant',
    this.clientName,
    this.primaryColor,
    this.themeMode = FluxChatThemeMode.system,
    this.greeting = 'Hello! How can I help you today?',
    this.placeholder = 'Write a message…',
    this.showBranding = true,
    // FAB-specific
    this.position = FabPosition.bottomRight,
    this.launcherLabel,
    // Slots
    this.customAvatar,
    this.customLauncher,
    // Context injection (replaces window.fluxchatContext from the JS widget)
    this.contextBuilder,
    // Callbacks
    this.onMessageSent,
    this.onReply,
    this.onError,
  });

  // ─── Client ────────────────────────────────────────────────────────────────

  /// API key sent as `X-API-Key`. Required for public bot endpoints.
  final String apiKey;

  /// Override the API base URL (useful for staging environments).
  final String? baseUrl;

  /// Default organisation id forwarded to knowledge / config requests.
  final String? organizationId;

  /// Per-request HTTP timeout. Defaults to 30 seconds.
  final Duration timeout;

  /// Extra HTTP headers forwarded on every request.
  final Map<String, String>? headers;

  // ─── UI ────────────────────────────────────────────────────────────────────

  /// Display name shown in the chat header (e.g. "Léa").
  final String assistantName;

  /// Your brand name shown below the assistant name in the header.
  final String? clientName;

  /// Seed color used to generate the Material 3 color scheme.
  /// Falls back to the host app's primary color when null.
  final Color? primaryColor;

  /// Light / dark / system (follows device setting). Defaults to system.
  final FluxChatThemeMode themeMode;

  /// First message shown by the assistant when the chat opens.
  final String greeting;

  /// Placeholder text for the message input field.
  final String placeholder;

  /// Whether to show the "Powered by Benflux" footer. Defaults to true.
  final bool showBranding;

  // ─── FAB ───────────────────────────────────────────────────────────────────

  /// Screen corner where the FAB appears. Defaults to [FabPosition.bottomRight].
  final FabPosition position;

  /// Optional label shown next to the FAB icon (renders an extended FAB).
  final String? launcherLabel;

  // ─── Customisation slots ───────────────────────────────────────────────────

  /// Replaces the default initial-letter avatar in the chat header.
  final Widget? customAvatar;

  /// Replaces the default [FloatingActionButton] launcher entirely.
  final Widget? customLauncher;

  // ─── Context ───────────────────────────────────────────────────────────────

  /// Called before each message is sent. The returned string is appended to
  /// the request as `context`, giving the bot real-time data about the
  /// current user or screen (replaces `window.fluxchatContext` from the JS SDK).
  ///
  /// ```dart
  /// contextBuilder: () => 'User: ${user.name}, plan: ${user.plan}',
  /// ```
  final String Function()? contextBuilder;

  // ─── Callbacks ─────────────────────────────────────────────────────────────

  /// Called after the user sends a message, with the raw text.
  final void Function(String message)? onMessageSent;

  /// Called after the assistant replies, with the reply text.
  final void Function(String reply)? onReply;

  /// Called when a network or API error occurs, with the exception.
  final void Function(Object error)? onError;
}
