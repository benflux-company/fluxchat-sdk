/// Header bar shared by the FAB panel and the full-screen page.
library;

import 'package:flutter/material.dart';

import '../options.dart';

/// Displays the assistant avatar, name, optional client brand, and an action
/// (close button in FAB panel mode, nothing in page mode — the AppBar handles
/// navigation there).
class ChatHeader extends StatelessWidget {
  const ChatHeader({
    super.key,
    required this.options,
    this.onClose,
    this.onClear,
  });

  final FluxChatOptions options;

  /// Called when the close icon is tapped. Pass null to hide the icon
  /// (e.g. inside a [Scaffold] that already has a back button).
  final VoidCallback? onClose;

  /// Called when the user taps the clear-history button.
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
      decoration: BoxDecoration(
        color: scheme.primary,
        // Rounded top corners when used inside the FAB panel card.
        borderRadius: onClose != null
            ? const BorderRadius.vertical(top: Radius.circular(20))
            : BorderRadius.zero,
      ),
      child: Row(
        children: [
          // ── Avatar ────────────────────────────────────────────────────────
          _Avatar(options: options, scheme: scheme),
          const SizedBox(width: 12),
          // ── Name + subtitle ───────────────────────────────────────────────
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
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
          ),
          // ── Action buttons ────────────────────────────────────────────────
          if (onClear != null)
            IconButton(
              onPressed: onClear,
              icon: const Icon(Icons.refresh_rounded),
              color: scheme.onPrimary.withValues(alpha: 0.8),
              tooltip: 'Clear history',
            ),
          if (onClose != null)
            IconButton(
              onPressed: onClose,
              icon: const Icon(Icons.close_rounded),
              color: scheme.onPrimary,
              tooltip: 'Close',
            ),
        ],
      ),
    );
  }
}

/// Round avatar — shows [FluxChatOptions.customAvatar] when provided,
/// otherwise falls back to the first letter of [FluxChatOptions.assistantName].
class _Avatar extends StatelessWidget {
  const _Avatar({required this.options, required this.scheme});

  final FluxChatOptions options;
  final ColorScheme scheme;

  @override
  Widget build(BuildContext context) {
    if (options.customAvatar != null) {
      return ClipOval(
        child: SizedBox(width: 36, height: 36, child: options.customAvatar),
      );
    }

    return CircleAvatar(
      radius: 18,
      backgroundColor: scheme.primaryContainer,
      child: Text(
        options.assistantName.isNotEmpty
            ? options.assistantName[0].toUpperCase()
            : 'A',
        style: TextStyle(
          color: scheme.onPrimaryContainer,
          fontWeight: FontWeight.w700,
          fontSize: 15,
        ),
      ),
    );
  }
}
