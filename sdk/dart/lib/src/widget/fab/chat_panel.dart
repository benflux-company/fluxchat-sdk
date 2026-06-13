/// The floating chat panel that appears above the FAB launcher.
library;

import 'package:flutter/material.dart';

import '../controller.dart';
import '../options.dart';
import '../shared/chat_body.dart';
import '../shared/chat_header.dart';
import '../shared/chat_input.dart';

/// Animated card panel that slides up from the FAB corner.
///
/// Visibility is driven by [controller.isOpen]. The panel respects the screen
/// safe-area and caps its size so it never covers the full screen.
class ChatPanel extends StatelessWidget {
  const ChatPanel({
    super.key,
    required this.controller,
    required this.options,
  });

  final FluxChatController controller;
  final FluxChatOptions options;

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    // Panel fills 90 % of narrow screens; caps at 380 × 580 on larger ones.
    final panelWidth = (mq.size.width * 0.9).clamp(0.0, 380.0);
    final panelHeight = (mq.size.height * 0.75).clamp(0.0, 580.0);
    // Bottom margin: FAB height (56) + spacing (16) + safe area.
    final bottomOffset = 56.0 + 16.0 + mq.padding.bottom;

    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        return AnimatedSlide(
          offset: controller.isOpen ? Offset.zero : const Offset(0, 0.04),
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          child: AnimatedOpacity(
            opacity: controller.isOpen ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 200),
            child: IgnorePointer(
              ignoring: !controller.isOpen,
              child: _PanelCard(
                width: panelWidth,
                height: panelHeight,
                bottomOffset: bottomOffset,
                options: options,
                controller: controller,
                position: options.position,
              ),
            ),
          ),
        );
      },
    );
  }
}

/// The actual [Card] surface with header, message list, and input.
class _PanelCard extends StatelessWidget {
  const _PanelCard({
    required this.width,
    required this.height,
    required this.bottomOffset,
    required this.options,
    required this.controller,
    required this.position,
  });

  final double width;
  final double height;
  final double bottomOffset;
  final FluxChatOptions options;
  final FluxChatController controller;
  final FabPosition position;

  // Map the FAB corner to horizontal / vertical panel offsets.
  bool get _isRight =>
      position == FabPosition.bottomRight || position == FabPosition.topRight;
  bool get _isBottom =>
      position == FabPosition.bottomRight || position == FabPosition.bottomLeft;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Positioned(
      right: _isRight ? 16 : null,
      left: _isRight ? null : 16,
      bottom: _isBottom ? bottomOffset : null,
      top: _isBottom ? null : bottomOffset,
      child: SizedBox(
        width: width,
        height: height,
        child: Card(
          elevation: 6,
          surfaceTintColor: scheme.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              ChatHeader(
                options: options,
                onClose: controller.close,
                onClear: controller.clearHistory,
              ),
              Expanded(
                child: ChatBody(
                  controller: controller,
                  showBranding: options.showBranding,
                ),
              ),
              ChatInput(
                onSend: controller.send,
                placeholder: options.placeholder,
                isLoading: controller.isLoading,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
