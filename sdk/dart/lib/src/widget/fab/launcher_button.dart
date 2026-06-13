/// The floating action button that toggles the chat panel.
library;

import 'package:flutter/material.dart';

import '../controller.dart';
import '../options.dart';

/// Renders the [FluxChatOptions.customLauncher] when provided, otherwise falls
/// back to a Material 3 [FloatingActionButton] (extended when a label is set).
///
/// Positioned in the corner dictated by [FluxChatOptions.position].
class LauncherButton extends StatelessWidget {
  const LauncherButton({
    super.key,
    required this.controller,
    required this.options,
  });

  final FluxChatController controller;
  final FluxChatOptions options;

  bool get _isRight =>
      options.position == FabPosition.bottomRight ||
      options.position == FabPosition.topRight;

  bool get _isBottom =>
      options.position == FabPosition.bottomRight ||
      options.position == FabPosition.bottomLeft;

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    // Keep the FAB 16 dp from the edge and above the system navigation bar.
    const edge = 16.0;
    final bottom = _isBottom ? edge + mq.padding.bottom : null;
    final top = _isBottom ? null : edge + mq.padding.top;

    return Positioned(
      right: _isRight ? edge : null,
      left: _isRight ? null : edge,
      bottom: bottom,
      top: top,
      child: ListenableBuilder(
        listenable: controller,
        builder: (context, _) {
          if (options.customLauncher != null) {
            return GestureDetector(
              onTap: controller.toggle,
              child: options.customLauncher,
            );
          }
          return _DefaultFab(controller: controller, options: options);
        },
      ),
    );
  }
}

/// The default M3 FAB — extended when a label is provided, compact otherwise.
class _DefaultFab extends StatelessWidget {
  const _DefaultFab({required this.controller, required this.options});

  final FluxChatController controller;
  final FluxChatOptions options;

  @override
  Widget build(BuildContext context) {
    // Animate between chat and close icons.
    final icon = AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      transitionBuilder: (child, anim) =>
          ScaleTransition(scale: anim, child: child),
      child: Icon(
        controller.isOpen ? Icons.close_rounded : Icons.chat_bubble_rounded,
        key: ValueKey(controller.isOpen),
      ),
    );

    if (options.launcherLabel != null && !controller.isOpen) {
      return FloatingActionButton.extended(
        heroTag: 'fluxchat_fab',
        onPressed: controller.toggle,
        icon: icon,
        label: Text(options.launcherLabel!),
      );
    }

    return FloatingActionButton(
      heroTag: 'fluxchat_fab',
      onPressed: controller.toggle,
      child: icon,
    );
  }
}
