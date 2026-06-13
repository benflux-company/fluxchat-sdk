/// A single chat bubble rendered in Material 3 style.
library;

import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

import '../chat_message_model.dart';

/// Renders one [ChatMessage] as a left-aligned (assistant) or right-aligned
/// (user) bubble, using the host [ColorScheme] for colours.
///
/// Assistant replies are rendered as Markdown so code blocks, bold text, and
/// lists display correctly.
class MessageBubble extends StatelessWidget {
  const MessageBubble({
    super.key,
    required this.message,
  });

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == ChatMessageRole.user;
    final scheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    // User bubbles: primary container. Assistant bubbles: surface variant.
    // Error bubbles: error container.
    final Color bgColor;
    final Color fgColor;

    if (message.isError) {
      bgColor = scheme.errorContainer;
      fgColor = scheme.onErrorContainer;
    } else if (isUser) {
      bgColor = scheme.primaryContainer;
      fgColor = scheme.onPrimaryContainer;
    } else {
      bgColor = scheme.surfaceContainerHigh;
      fgColor = scheme.onSurface;
    }

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        // Cap bubble width so long messages don't stretch edge-to-edge.
        constraints: const BoxConstraints(maxWidth: 320),
        child: Container(
          margin: EdgeInsets.only(
            top: 4,
            bottom: 4,
            left: isUser ? 48 : 0,
            right: isUser ? 0 : 48,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(18),
              topRight: const Radius.circular(18),
              bottomLeft: Radius.circular(isUser ? 18 : 4),
              bottomRight: Radius.circular(isUser ? 4 : 18),
            ),
          ),
          child: isUser
              ? Text(
                  message.content,
                  style: textTheme.bodyMedium?.copyWith(color: fgColor),
                )
              : _AssistantContent(
                  content: message.content,
                  textColor: fgColor,
                ),
        ),
      ),
    );
  }
}

/// Renders assistant text as Markdown with colours taken from [textColor].
class _AssistantContent extends StatelessWidget {
  const _AssistantContent({
    required this.content,
    required this.textColor,
  });

  final String content;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).textTheme.bodyMedium;

    return MarkdownBody(
      data: content,
      // Inherit font size and colour from the bubble container.
      styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
        p: base?.copyWith(color: textColor),
        code: base?.copyWith(
          fontFamily: 'monospace',
          color: textColor,
          backgroundColor: Colors.transparent,
        ),
      ),
      // Prevent the markdown widget from scrolling independently —
      // the parent ListView handles scrolling.
      shrinkWrap: true,
    );
  }
}

// ─── Loading indicator ────────────────────────────────────────────────────────

/// Three animated dots shown while the assistant is typing.
class TypingIndicator extends StatefulWidget {
  const TypingIndicator({super.key});

  @override
  State<TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<TypingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHigh,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(18),
            topRight: Radius.circular(18),
            bottomRight: Radius.circular(18),
            bottomLeft: Radius.circular(4),
          ),
        ),
        child: AnimatedBuilder(
          animation: _anim,
          builder: (_, __) => Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(3, (i) => _Dot(delay: i * 0.25, anim: _anim)),
          ),
        ),
      ),
    );
  }
}

/// A single animated dot for [TypingIndicator].
class _Dot extends StatelessWidget {
  const _Dot({required this.delay, required this.anim});

  final double delay;
  final Animation<double> anim;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    // Offset each dot's opacity cycle so they pulse in sequence.
    final value = ((anim.value + delay) % 1.0);
    final opacity = (value < 0.5 ? value * 2 : (1 - value) * 2).clamp(0.3, 1.0);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 3),
      child: Opacity(
        opacity: opacity,
        child: Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(
            color: scheme.onSurfaceVariant,
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }
}
