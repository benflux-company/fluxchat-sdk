/// FluxChat Flutter widget library.
///
/// Provides two ready-to-use chat interfaces that share the same core:
///
/// **FAB mode** — a floating chat bubble that hovers above all screens:
/// ```dart
/// import 'package:fluxchat_sdk/widget.dart';
///
/// // Option A (recommended): wrap MaterialApp.builder
/// MaterialApp(
///   builder: FluxChatOverlay.builder(
///     options: FluxChatOptions(apiKey: 'fc_live_xxx'),
///   ),
/// )
///
/// // Option B: place FluxChatFab yourself inside a Stack
/// Stack(children: [YourPage(), FluxChatFab(options: options)])
/// ```
///
/// **Full-page mode** — a ChatGPT-style screen navigated to as a route:
/// ```dart
/// Navigator.push(context, MaterialPageRoute(
///   builder: (_) => FluxChatPage(options: options),
/// ));
/// ```
library fluxchat_widget;

// ── Options & controller ─────────────────────────────────────────────────────
export 'src/widget/options.dart';
export 'src/widget/controller.dart';
export 'src/widget/chat_message_model.dart';

// ── FAB mode ─────────────────────────────────────────────────────────────────
export 'src/widget/fab/fluxchat_overlay.dart';
export 'src/widget/fab/fluxchat_fab.dart';

// ── Full-page mode ────────────────────────────────────────────────────────────
export 'src/widget/page/fluxchat_page.dart';

// ── Re-export core types so callers need only one import ─────────────────────
export 'fluxchat_sdk.dart';
