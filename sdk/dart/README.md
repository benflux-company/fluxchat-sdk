# FluxChat Flutter/Dart SDK

Official Flutter & Dart SDK for [FluxChat](https://fluxchat-corp.com) — drop an AI assistant into any mobile or web app in minutes.

Includes a **typed API client**, a **floating FAB widget**, and a **full-screen chat page**, all built on Material 3.

[![pub version](https://img.shields.io/badge/pub-v0.1.0-4f46e5)](https://github.com/benflux-company/fluxchat-sdk/tree/main/sdk/dart)
[![license](https://img.shields.io/github/license/benflux-company/fluxchat-sdk?color=4f46e5)](../../LICENSE)
[![flutter](https://img.shields.io/badge/flutter-%3E%3D3.16-4f46e5)](https://flutter.dev)

[Dashboard](https://fluxchat-corp.com) · [API](https://dev-api.fluxchat-corp.com) · [Benflux](https://benflux-corp.com)

---

## Features

- **Ask API** — send messages and receive high-quality answers from your assistant.
- **Per-request context** — inject real-time data (user, page, cart…) via `contextBuilder`.
- **Knowledge base** — create, update, and delete articles with a scoped API key.
- **Persona config** — set the assistant name, tone, and style rules per organisation.
- **FAB widget** — a floating chat bubble that hovers above all screens (Material 3).
- **Full-screen page** — a ChatGPT-style screen navigated to as a route.
- **Programmatic control** — open, close, and send from anywhere via `FluxChatController`.
- **Universal** — Android, iOS, and Flutter Web from one package.

---

## Install

### From GitHub (current)

```yaml
# pubspec.yaml
dependencies:
  fluxchat_sdk:
    git:
      url: https://github.com/benflux-company/fluxchat-sdk.git
      path: sdk/dart
      ref: sdk/dart/v0.1.0
```

```bash
flutter pub get
```

### From pub.dev (coming soon)

```yaml
dependencies:
  fluxchat_sdk: ^0.1.0
```

Requires Flutter **≥ 3.16** and Dart **≥ 3.0**.

---

## Quickstart

### 1. Core SDK (pure Dart)

```dart
import 'package:fluxchat_sdk/fluxchat_sdk.dart';

final fluxchat = FluxChat(apiKey: 'fc_live_your_key');

final res = await fluxchat.ask(AskOptions(
  message: 'What are your opening hours?',
  context: 'User is on the contact page.',
));

print(res.reply);
```

### 2. FAB widget — floating bubble over the whole app

```dart
import 'package:fluxchat_sdk/widget.dart';

// Wrap MaterialApp.builder — the FAB floats above every route automatically.
MaterialApp(
  builder: FluxChatOverlay.builder(
    options: FluxChatOptions(
      apiKey: 'fc_live_your_key',
      assistantName: 'Léa',
      clientName: 'Acme Bank',
    ),
  ),
)
```

### 3. Full-screen page — ChatGPT-style experience

```dart
Navigator.push(context, MaterialPageRoute(
  builder: (_) => FluxChatPage(
    options: FluxChatOptions(
      apiKey: 'fc_live_your_key',
      assistantName: 'Léa',
    ),
  ),
));
```

---

## Widget modes

The SDK ships two ready-to-use chat interfaces. They share the same `FluxChatController` and `FluxChatOptions` — pick the one that fits your UX.

### Mode A — `FluxChatOverlay` (recommended default)

Wraps `MaterialApp.builder` and injects the FAB + panel above every route with zero per-page setup.

```dart
MaterialApp(
  builder: FluxChatOverlay.builder(
    options: FluxChatOptions(apiKey: 'fc_live_xxx', assistantName: 'Léa'),
  ),
  home: MyHomePage(),
)
```

### Mode B — `FluxChatFab` in a Stack

Place the FAB yourself anywhere in the widget tree.

```dart
Scaffold(
  body: Stack(
    children: [
      MyPageContent(),
      FluxChatFab(
        options: FluxChatOptions(
          apiKey: 'fc_live_xxx',
          position: FabPosition.bottomLeft,
        ),
      ),
    ],
  ),
)
```

### Mode C — `FluxChatPage`

A full-screen `Scaffold` navigated to as a regular route.

```dart
// GoRouter
GoRoute(
  path: '/chat',
  builder: (_, __) => FluxChatPage(options: options),
),

// Navigator
Navigator.push(context, MaterialPageRoute(
  builder: (_) => FluxChatPage(options: options),
));
```

---

## Programmatic control

Create a `FluxChatController` and pass it to the widget to drive the session from anywhere in the tree.

```dart
final ctrl = FluxChatController(
  options: FluxChatOptions(apiKey: 'fc_live_xxx', assistantName: 'Léa'),
);

// Open from a custom button
ElevatedButton(onPressed: ctrl.open, child: Text('Chat with us'));

// Send a pre-built message
ctrl.send('I need help with my order.');

// Clear the conversation
ctrl.clearHistory();

// Wire to a widget — the controller owns the session
FluxChatOverlay(options: options, controller: ctrl, child: child)
```

The controller implements `ChangeNotifier`, so any `ListenableBuilder` or `AnimatedBuilder` in the tree rebuilds when state changes.

---

## Injecting user context

The mobile equivalent of `window.fluxchatContext` — called before every message is sent.

```dart
FluxChatOptions(
  apiKey: 'fc_live_xxx',
  contextBuilder: () {
    // Read from your auth state, route, or any provider.
    return 'User: ${user.name}, plan: ${user.plan}, screen: checkout';
  },
)
```

The returned string is passed as the `context` field and treated by the bot as a priority source of truth above the knowledge base.

---

## Customisation

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `String` *(required)* | — | Organisation API key. |
| `baseUrl` | `String?` | FluxChat API v2 | Override the API endpoint. |
| `organizationId` | `String?` | — | Default org id for knowledge / config calls. |
| `timeout` | `Duration` | `30s` | Per-request HTTP timeout. |
| `assistantName` | `String` | `'Assistant'` | Display name in the header and avatar. |
| `clientName` | `String?` | — | Your brand name shown below the assistant name. |
| `primaryColor` | `Color?` | App primary | Seed color for the M3 `ColorScheme`. |
| `themeMode` | `FluxChatThemeMode` | `system` | `light`, `dark`, or `system`. |
| `greeting` | `String` | `'Hello! How can I help…'` | First message shown when the chat opens. |
| `placeholder` | `String` | `'Write a message…'` | Input field hint. |
| `showBranding` | `bool` | `true` | Show the "Powered by Benflux" footer. |
| `position` | `FabPosition` | `bottomRight` | FAB corner: `bottomRight`, `bottomLeft`, `topRight`, `topLeft`. |
| `launcherLabel` | `String?` | — | Label next to the FAB icon (renders an extended FAB). |
| `customAvatar` | `Widget?` | — | Replaces the default initial-letter avatar. |
| `customLauncher` | `Widget?` | — | Replaces the default `FloatingActionButton`. |
| `contextBuilder` | `String Function()?` | — | Called before each send to inject real-time context. |
| `onMessageSent` | `void Function(String)?` | — | Called after the user sends a message. |
| `onReply` | `void Function(String)?` | — | Called after the assistant replies. |
| `onError` | `void Function(Object)?` | — | Called on network or API errors. |

---

## SDK reference

### Create a client

```dart
import 'package:fluxchat_sdk/fluxchat_sdk.dart';

final fluxchat = FluxChat(
  apiKey: 'fc_live_your_key',     // X-API-Key auth
  // token: 'eyJ...',             // OR a JWT for admin operations
  organizationId: 'org-uuid',     // default org for knowledge / config
  timeout: Duration(seconds: 20), // optional, default 30s
);
```

### `ask(options)`

```dart
final res = await fluxchat.ask(AskOptions(
  message: 'How do I return an item?',
  context: 'Return policy: 30 days free for Premium members.',
  conversationId: previousConvId, // omit for a stateless one-off answer
));

print(res.reply);           // assistant reply (may contain Markdown)
print(res.conversationId);  // link subsequent turns
print(res.confidence);      // 0–1 intent confidence
```

### `testKey()`

```dart
final info = await fluxchat.testKey();
print(info.organizationId);
print(info.scopes); // ['bot:write']
```

### Knowledge base

```dart
// Writes require an API key with the bot:write scope.
final article = await fluxchat.knowledge.create(CreateKnowledgeInput(
  title: 'Opening hours',
  content: 'Mon–Fri 9am–6pm.',
  category: KnowledgeCategory.general,
  keywords: ['hours', 'open'],
));

await fluxchat.knowledge.update(article.id, UpdateKnowledgeInput(
  content: 'Mon–Fri 8am–7pm.',
));

await fluxchat.knowledge.remove(article.id);

// Reads require a JWT token.
final all = await fluxchat.knowledge.list();
final one = await fluxchat.knowledge.get(article.id);

// Crawl a URL or sitemap (v2 only, bot:write scope).
await fluxchat.knowledge.crawl('https://my-site.com/sitemap.xml', isSitemap: true);
```

### Persona config

```dart
await fluxchat.config.update(BotConfig(
  assistantName: 'Léa',
  tone: 'warm and concise',
  styleRules: 'Use "tu", avoid jargon.',
));

final cfg = await fluxchat.config.get();
```

### Error handling

Every failure is a subtype of `FluxChatException`:

```dart
import 'package:fluxchat_sdk/fluxchat_sdk.dart';

try {
  await fluxchat.knowledge.create(CreateKnowledgeInput(title: 'x', content: 'y'));
} on FluxChatApiException catch (e) {
  print('${e.status} — ${e.message}'); // e.g. 403 — API key missing bot:write scope
} on FluxChatNetworkException catch (e) {
  print('Network: ${e.message}');
} on FluxChatConfigException catch (e) {
  print('Config: ${e.message}');
}
```

---

## Authentication & scopes

| Operation | Auth |
|---|---|
| `ask`, `testKey`, widget | API key (`X-API-Key`) |
| Knowledge **write** (create / update / delete / crawl) | API key with `bot:write` scope |
| Knowledge **read**, persona `config` | JWT (admin) token |

Create and manage API keys from the **[FluxChat dashboard](https://fluxchat-corp.com)** → Organisation settings → API Keys.

---

## Examples

See [`examples/dart_quickstart.dart`](../../examples/dart_quickstart.dart) for a pure-Dart CLI example and [`examples/flutter_example/`](../../examples/flutter_example/) for a complete Flutter app that demonstrates all three widget modes and programmatic control.

---

## Development

```bash
cd sdk/dart
flutter pub get
flutter test          # run all tests
flutter analyze       # static analysis
```

---

<div align="center">

A product by **[Benflux](https://benflux-corp.com)** · MIT Licensed

</div>
