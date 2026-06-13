/// Full-screen chat experience — the ChatGPT-style mode.
///
/// Navigate to [FluxChatPage] like any other route, or declare it in your
/// router. It is completely independent of [FluxChatOverlay] / [FluxChatFab].
library;

import 'package:flutter/material.dart';

import '../controller.dart';
import '../options.dart';
import '../shared/chat_body.dart';
import '../shared/chat_input.dart';

/// A full-screen [Scaffold] that provides a polished chat experience
/// comparable to first-party AI chat apps.
///
/// **Navigate to it:**
/// ```dart
/// Navigator.push(
///   context,
///   MaterialPageRoute(
///     builder: (_) => FluxChatPage(
///       options: FluxChatOptions(
///         apiKey: 'fc_live_xxx',
///         assistantName: 'Léa',
///       ),
///     ),
///   ),
/// );
/// ```
///
/// **Declare it in your router (GoRouter, auto_route, etc.):**
/// ```dart
/// GoRoute(
///   path: '/chat',
///   builder: (_, __) => FluxChatPage(options: options),
/// ),
/// ```
///
/// **With an external controller for programmatic access:**
/// ```dart
/// final ctrl = FluxChatController(options: options);
/// FluxChatPage(options: options, controller: ctrl);
/// // Elsewhere: ctrl.send('Hello'); ctrl.clearHistory();
/// ```
class FluxChatPage extends StatefulWidget {
  const FluxChatPage({
    super.key,
    required this.options,
    this.controller,
  });

  /// All visual and API configuration.
  final FluxChatOptions options;

  /// Optional external controller for programmatic access to the session.
  final FluxChatController? controller;

  @override
  State<FluxChatPage> createState() => _FluxChatPageState();
}

class _FluxChatPageState extends State<FluxChatPage> {
  late final FluxChatController _controller;
  late final bool _ownsController;

  @override
  void initState() {
    super.initState();
    _ownsController = widget.controller == null;
    _controller =
        widget.controller ?? FluxChatController(options: widget.options);
  }

  @override
  void dispose() {
    if (_ownsController) _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final options = widget.options;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      // ── App bar ─────────────────────────────────────────────────────────
      appBar: _ChatAppBar(options: options, controller: _controller),
      backgroundColor: scheme.surface,
      // ── Body: messages + input ──────────────────────────────────────────
      body: Column(
        children: [
          Expanded(
            child: ChatBody(
              controller: _controller,
              showBranding: options.showBranding,
            ),
          ),
          ChatInput(
            onSend: _controller.send,
            placeholder: options.placeholder,
            isLoading: _controller.isLoading,
          ),
        ],
      ),
    );
  }
}

// ─── Custom AppBar ────────────────────────────────────────────────────────────

/// M3 AppBar with the assistant avatar, name, and a clear-history action.
class _ChatAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _ChatAppBar({required this.options, required this.controller});

  final FluxChatOptions options;
  final FluxChatController controller;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return AppBar(
      // M3 AppBar inherits colorScheme.surface by default; override to primary
      // so the header stands out and matches the FAB panel header colour.
      backgroundColor: scheme.primary,
      foregroundColor: scheme.onPrimary,
      centerTitle: false,
      // ── Leading avatar ──────────────────────────────────────────────────
      leading: Padding(
        padding: const EdgeInsets.all(10),
        child: options.customAvatar != null
            ? ClipOval(child: options.customAvatar)
            : CircleAvatar(
                backgroundColor: scheme.primaryContainer,
                child: Text(
                  options.assistantName.isNotEmpty
                      ? options.assistantName[0].toUpperCase()
                      : 'A',
                  style: TextStyle(
                    color: scheme.onPrimaryContainer,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
      ),
      // ── Title + subtitle ────────────────────────────────────────────────
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            options.assistantName,
            style: textTheme.titleMedium?.copyWith(
              color: scheme.onPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (options.clientName != null)
            Text(
              options.clientName!,
              style: textTheme.bodySmall?.copyWith(
                color: scheme.onPrimary.withValues(alpha: 0.8),
              ),
            ),
        ],
      ),
      // ── Actions ─────────────────────────────────────────────────────────
      actions: [
        IconButton(
          onPressed: _confirmClear(context),
          icon: const Icon(Icons.refresh_rounded),
          tooltip: 'Clear history',
          color: scheme.onPrimary,
        ),
      ],
    );
  }

  /// Shows a confirmation dialog before wiping the conversation.
  VoidCallback _confirmClear(BuildContext context) => () async {
        final confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Clear conversation?'),
            content: const Text(
              'All messages will be removed and the conversation will restart.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Clear'),
              ),
            ],
          ),
        );
        if (confirmed == true) controller.clearHistory();
      };
}
