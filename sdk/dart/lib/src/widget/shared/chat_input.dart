/// Message input bar shared by the FAB panel and the full-screen page.
library;

import 'package:flutter/material.dart';

/// A text field paired with a send [FilledButton.icon], following Material 3
/// input decoration guidelines.
///
/// Calls [onSend] when the user taps the send icon or presses Enter on a
/// physical keyboard. The field clears itself after each send.
class ChatInput extends StatefulWidget {
  const ChatInput({
    super.key,
    required this.onSend,
    required this.placeholder,
    this.isLoading = false,
  });

  /// Called with the trimmed message text when the user confirms a send.
  final void Function(String message) onSend;

  /// Placeholder shown when the field is empty.
  final String placeholder;

  /// Disables the field and the send button while a reply is in flight.
  final bool isLoading;

  @override
  State<ChatInput> createState() => _ChatInputState();
}

class _ChatInputState extends State<ChatInput> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _submit() {
    final text = _controller.text.trim();
    if (text.isEmpty || widget.isLoading) return;
    _controller.clear();
    widget.onSend(text);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(top: BorderSide(color: scheme.outlineVariant, width: 0.5)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // ── Text field ──────────────────────────────────────────────────
            Expanded(
              child: TextField(
                controller: _controller,
                focusNode: _focusNode,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _submit(),
                enabled: !widget.isLoading,
                decoration: InputDecoration(
                  hintText: widget.placeholder,
                  hintStyle: TextStyle(color: scheme.onSurfaceVariant),
                  filled: true,
                  fillColor: scheme.surfaceContainerHighest,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: scheme.primary, width: 1.5),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // ── Send button ─────────────────────────────────────────────────
            // FilledButton is the M3 primary action component.
            FilledButton(
              onPressed: widget.isLoading ? null : _submit,
              style: FilledButton.styleFrom(
                minimumSize: const Size(44, 44),
                padding: const EdgeInsets.all(10),
                shape: const CircleBorder(),
              ),
              child: widget.isLoading
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: scheme.onPrimary,
                      ),
                    )
                  : const Icon(Icons.send_rounded, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}
