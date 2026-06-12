/// FluxChat SDK for Dart and Flutter.
///
/// ```dart
/// import 'package:fluxchat/fluxchat.dart';
///
/// final client = FluxChat(apiKey: 'your-api-key');
/// final result = await client.ask('Hello!');
/// print(result.reply);
/// ```
library fluxchat;

export 'src/exceptions.dart';
export 'src/models.dart';
export 'src/knowledge_client.dart';
export 'src/fluxchat_client.dart';
