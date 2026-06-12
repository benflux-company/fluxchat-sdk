# FluxChat SDK — Flutter / Dart

> Community SDK — tracked in [issue #3](https://github.com/benflux-company/fluxchat-sdk/issues/3)

## Status

**Open for contribution.** This directory is a placeholder. See [CONTRIBUTING.md](../../CONTRIBUTING.md) and the [full guide](https://docs.fluxchat-corp.com/docs#for-devs) before starting.

## Sandbox — test credentials

| Field | Value |
|---|---|
| Base URL | `https://dev-api.fluxchat-corp.com/api/v2` |
| API Key | `fc_prod_f45868df738ddbec537c6c929570f1dad830fb0ca0cd5f82652e9eb7db4ede16` |
| Org ID | `ba134db3-993d-4076-8431-bb2c922d4db2` |
| Dashboard | https://fluxchat-corp.com (login: heyakaf832@ocuser.com / Test1234567890@) |

## Quickstart (target API)

```dart
import 'package:fluxchat/fluxchat.dart';

final client = FluxChat(apiKey: 'fc_prod_...');

// Ask the bot
final response = await client.ask('What are your opening hours?');
print(response.reply);

// Capture a page (call from initState / screen lifecycle)
await client.capturePage(
  url: 'app://my-app/home',
  title: 'Home',
  content: extractVisibleText(),
);
```

## What to implement

| Method | Endpoint | Required |
|---|---|---|
| `ask(message, {context, sessionId, conversationId})` | `POST /public/bot/ask` | Yes |
| `testKey()` | `GET /public/bot/test` | Yes |
| `capturePage(url, title, content)` | `POST /public/bot/pages` | Yes |
| `knowledge.create(title, content, category?)` | `POST /bot/knowledge` | Yes |
| `knowledge.list()` | `GET /bot/knowledge` | Yes |
| `knowledge.delete(id)` | `DELETE /bot/knowledge/:id` | Yes |

## Package config

Use `pubspec.yaml` with `http` as the only dependency. Target Dart 3.0+ / Flutter 3.10+.

## Testing

After implementing `capturePage`, follow the [5-step verification protocol](https://docs.fluxchat-corp.com/docs#sandbox-verify) using the sandbox above.
