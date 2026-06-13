/// Full-app overlay wrapper — Option A for the FAB mode.
///
/// Wrap [MaterialApp.builder] (or any root widget) with [FluxChatOverlay] and
/// the FAB + panel will float above all routes without any per-page setup.
library;

import 'package:flutter/material.dart';

import '../controller.dart';
import '../options.dart';
import 'chat_panel.dart';
import 'launcher_button.dart';

/// Injects a [FluxChatFab] into the widget tree via a [Stack] so it floats
/// above every route of the application.
///
/// **Option A — wrap [MaterialApp.builder] (recommended default):**
/// ```dart
/// MaterialApp(
///   builder: FluxChatOverlay.builder(
///     options: FluxChatOptions(apiKey: 'fc_live_xxx'),
///   ),
/// )
/// ```
///
/// **Or wrap the child manually:**
/// ```dart
/// MaterialApp(
///   builder: (context, child) => FluxChatOverlay(
///     options: FluxChatOptions(apiKey: 'fc_live_xxx'),
///     child: child!,
///   ),
/// )
/// ```
///
/// **Programmatic control — pass your own controller:**
/// ```dart
/// final ctrl = FluxChatController(options: options);
///
/// MaterialApp(
///   builder: FluxChatOverlay.builder(options: options, controller: ctrl),
/// )
///
/// // Anywhere else in the tree:
/// ElevatedButton(onPressed: ctrl.open, child: Text('Chat with us'));
/// ```
class FluxChatOverlay extends StatefulWidget {
  const FluxChatOverlay({
    super.key,
    required this.options,
    required this.child,
    this.controller,
  });

  /// All visual and API configuration.
  final FluxChatOptions options;

  /// The underlying app content the FAB floats above.
  final Widget child;

  /// Optional external controller for programmatic open/close/send.
  final FluxChatController? controller;

  // ─── Convenience factory for MaterialApp.builder ──────────────────────────

  /// Returns a [TransitionBuilder] suitable for [MaterialApp.builder].
  ///
  /// ```dart
  /// MaterialApp(
  ///   builder: FluxChatOverlay.builder(options: options),
  /// )
  /// ```
  static TransitionBuilder builder({
    required FluxChatOptions options,
    FluxChatController? controller,
  }) =>
      (context, child) => FluxChatOverlay(
            options: options,
            controller: controller,
            child: child ?? const SizedBox.shrink(),
          );

  @override
  State<FluxChatOverlay> createState() => _FluxChatOverlayState();
}

class _FluxChatOverlayState extends State<FluxChatOverlay> {
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
    return Stack(
      children: [
        // ── App content ─────────────────────────────────────────────────────
        widget.child,
        // ── Animated chat panel ─────────────────────────────────────────────
        ChatPanel(controller: _controller, options: widget.options),
        // ── FAB launcher ───────────────────────────────────────────────────
        LauncherButton(controller: _controller, options: widget.options),
      ],
    );
  }
}
