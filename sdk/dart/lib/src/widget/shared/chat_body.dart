/// Scrollable message list + optional branding footer.
///
/// Extracted so it can be reused identically in both [FluxChatFab]'s panel
/// and [FluxChatPage].
library;

import 'package:flutter/material.dart';

import '../chat_message_model.dart';
import '../controller.dart';
import 'message_bubble.dart';

/// Renders the full message list and auto-scrolls to the latest entry.
///
/// Pass [controller] as a [ListenableBuilder] ancestor so the list rebuilds
/// whenever messages are added or loading state changes.
class ChatBody extends StatefulWidget {
  const ChatBody({
    super.key,
    required this.controller,
    this.showBranding = true,
  });

  final FluxChatController controller;

  /// Whether to show the "Powered by Benflux" footer.
  final bool showBranding;

  @override
  State<ChatBody> createState() => _ChatBodyState();
}

class _ChatBodyState extends State<ChatBody> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_scrollToBottom);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_scrollToBottom);
    _scrollController.dispose();
    super.dispose();
  }

  /// Jumps to the bottom after each new message is rendered.
  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final messages = widget.controller.messages;
        final isLoading = widget.controller.isLoading;

        return Column(
          children: [
            // ── Message list ────────────────────────────────────────────────
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                itemCount: messages.length + (isLoading ? 1 : 0),
                itemBuilder: (context, index) {
                  // Show the typing indicator as the last item while loading.
                  if (isLoading && index == messages.length) {
                    return const TypingIndicator();
                  }
                  return MessageBubble(
                    key: ValueKey(messages[index].id),
                    message: messages[index],
                  );
                },
              ),
            ),
            // ── Branding footer ─────────────────────────────────────────────
            if (widget.showBranding)
              Padding(
                padding: const EdgeInsets.only(bottom: 6, top: 2),
                child: Text(
                  'Powered by Benflux',
                  style: textTheme.labelSmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
