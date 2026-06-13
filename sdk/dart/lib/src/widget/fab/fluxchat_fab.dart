/// Stand-alone floating action button that manages its own controller.
///
/// Use [FluxChatFab] when you want to place the FAB yourself inside a [Stack]
/// or inside a [Scaffold]'s `floatingActionButton` slot (Option B).
/// For the automatic full-app overlay (Option A), prefer [FluxChatOverlay].
library;

import 'package:flutter/material.dart';

import '../controller.dart';
import '../options.dart';
import 'chat_panel.dart';
import 'launcher_button.dart';

/// A self-contained widget that shows a launcher button and the chat panel.
///
/// It creates and owns its [FluxChatController] unless an external one is
/// supplied via [controller] for programmatic control.
///
/// **Option B — manual placement in a Stack:**
/// ```dart
/// Scaffold(
///   body: Stack(
///     children: [
///       YourPage(),
///       FluxChatFab(apiKey: 'fc_live_xxx'),
///     ],
///   ),
/// )
/// ```
class FluxChatFab extends StatefulWidget {
  const FluxChatFab({
    super.key,
    required this.options,
    this.controller,
  });

  /// All visual and API configuration.
  final FluxChatOptions options;

  /// Supply an external controller for programmatic open/close/send.
  /// When null the widget creates and disposes its own controller.
  final FluxChatController? controller;

  @override
  State<FluxChatFab> createState() => _FluxChatFabState();
}

class _FluxChatFabState extends State<FluxChatFab> {
  late final FluxChatController _controller;
  late final bool _ownsController;

  @override
  void initState() {
    super.initState();
    _ownsController = widget.controller == null;
    _controller = widget.controller ??
        FluxChatController(options: widget.options);
  }

  @override
  void dispose() {
    // Only dispose the controller if we created it.
    if (_ownsController) _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // ── Chat panel (animated, sits above the launcher) ──────────────────
        ChatPanel(controller: _controller, options: widget.options),
        // ── FAB launcher button ─────────────────────────────────────────────
        LauncherButton(controller: _controller, options: widget.options),
      ],
    );
  }
}
