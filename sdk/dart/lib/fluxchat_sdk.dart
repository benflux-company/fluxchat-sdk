/// FluxChat Dart/Flutter SDK — core client library.
///
/// Import this file for the typed API client (no Flutter dependency):
/// ```dart
/// import 'package:fluxchat_sdk/fluxchat_sdk.dart';
///
/// final fluxchat = FluxChat(apiKey: 'fc_live_xxx');
/// final res = await fluxchat.ask(AskOptions(message: 'Hello!'));
/// ```
///
/// For the embeddable widgets import [package:fluxchat_sdk/widget.dart] instead.
library fluxchat_sdk;

export 'src/client.dart';
export 'src/errors.dart';
export 'src/types.dart';
